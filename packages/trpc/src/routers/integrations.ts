import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { schema } from '@kb/database';

import { protectedProcedure, router } from '../init';
import {
  decryptToken,
  digilockerDownload,
  digilockerListFiles,
  digilockerRefresh,
  digilockerToken,
  mintDigiLockerState,
  newCodeVerifier,
  pkceCodeChallenge,
  requireDigiLockerEnabled,
  verifyDigiLockerState,
  encryptToken,
} from '../integrations/digilocker';

const STATE_MAX_AGE_MS = 10 * 60 * 1000;
const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

export const integrationsRouter = router({
  digilocker: router({
    getAuthUrl: protectedProcedure.mutation(({ ctx }) => {
      const cfg = requireDigiLockerEnabled();
      const verifier = newCodeVerifier();
      const challenge = pkceCodeChallenge(verifier);
      const state = mintDigiLockerState({
        userId: ctx.authUserId,
        stateSecret: cfg.stateSecret,
        codeVerifier: verifier,
      });

      const url = new URL(`${cfg.baseUrl.replace(/\/$/, '')}/oauth2/1/authorize`);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('client_id', cfg.clientId);
      url.searchParams.set('redirect_uri', cfg.redirectUrl);
      url.searchParams.set('state', state);
      url.searchParams.set('code_challenge', challenge);
      url.searchParams.set('code_challenge_method', 'S256');
      return { url: url.toString() };
    }),

    exchangeCode: protectedProcedure
      .input(
        z.object({
          code: z.string().min(1).max(2048),
          state: z.string().min(1).max(4096),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const cfg = requireDigiLockerEnabled();
        const st = verifyDigiLockerState({
          state: input.state,
          stateSecret: cfg.stateSecret,
          maxAgeMs: STATE_MAX_AGE_MS,
        });
        if (st.u !== ctx.authUserId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'State user mismatch.' });
        }

        const tok = await digilockerToken({
          baseUrl: cfg.baseUrl,
          clientId: cfg.clientId,
          clientSecret: cfg.clientSecret,
          redirectUrl: cfg.redirectUrl,
          code: input.code,
          codeVerifier: st.v,
        });

        const now = new Date();
        const expiresAt =
          typeof tok.expires_in === 'number' ? new Date(Date.now() + tok.expires_in * 1000) : null;
        const accessEnc = encryptToken({ token: tok.access_token, secret: cfg.tokenSecret }).ciphertext;
        const refreshEnc = encryptToken({ token: tok.refresh_token ?? '', secret: cfg.tokenSecret }).ciphertext;

        await ctx.db
          .insert(schema.digilockerConnection)
          .values({
            userId: ctx.authUserId,
            status: 'connected',
            accessTokenEnc: accessEnc,
            refreshTokenEnc: refreshEnc,
            expiresAt: expiresAt ?? null,
            scopesJson: (tok.scope ?? '').split(' ').filter(Boolean),
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: schema.digilockerConnection.userId,
            set: {
              status: 'connected',
              accessTokenEnc: accessEnc,
              refreshTokenEnc: refreshEnc,
              expiresAt: expiresAt ?? null,
              scopesJson: (tok.scope ?? '').split(' ').filter(Boolean),
              updatedAt: now,
            },
          });

        return { ok: true as const };
      }),

    status: protectedProcedure.query(async ({ ctx }) => {
      try {
        requireDigiLockerEnabled();
      } catch {
        return { enabled: false as const, connected: false as const };
      }
      const [row] = await ctx.db
        .select()
        .from(schema.digilockerConnection)
        .where(eq(schema.digilockerConnection.userId, ctx.authUserId))
        .limit(1);
      return {
        enabled: true as const,
        connected: row?.status === 'connected',
        status: row?.status ?? null,
        expiresAt: row?.expiresAt ?? null,
      };
    }),

    listDocuments: protectedProcedure.query(async ({ ctx }) => {
      const cfg = requireDigiLockerEnabled();
      const [row] = await ctx.db
        .select()
        .from(schema.digilockerConnection)
        .where(and(eq(schema.digilockerConnection.userId, ctx.authUserId), eq(schema.digilockerConnection.status, 'connected')))
        .limit(1);
      if (!row) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'DigiLocker not connected.' });
      }

      let access = decryptToken({ ciphertext: row.accessTokenEnc, secret: cfg.tokenSecret });
      const exp = row.expiresAt?.getTime() ?? null;
      if (exp && exp <= Date.now() + 30_000) {
        const refresh = decryptToken({ ciphertext: row.refreshTokenEnc, secret: cfg.tokenSecret });
        const tok = await digilockerRefresh({
          baseUrl: cfg.baseUrl,
          clientId: cfg.clientId,
          clientSecret: cfg.clientSecret,
          refreshToken: refresh,
        });
        access = tok.access_token;
        const now = new Date();
        const expiresAt =
          typeof tok.expires_in === 'number' ? new Date(Date.now() + tok.expires_in * 1000) : null;
        await ctx.db
          .update(schema.digilockerConnection)
          .set({
            accessTokenEnc: encryptToken({ token: access, secret: cfg.tokenSecret }).ciphertext,
            expiresAt: expiresAt ?? null,
            updatedAt: now,
          })
          .where(eq(schema.digilockerConnection.id, row.id));
      }

      const items = await digilockerListFiles({ baseUrl: cfg.baseUrl, accessToken: access });
      return { items };
    }),

    downloadBase64: protectedProcedure
      .input(z.object({ uri: z.string().min(1).max(2048) }))
      .mutation(async ({ ctx, input }) => {
        const cfg = requireDigiLockerEnabled();
        const [row] = await ctx.db
          .select()
          .from(schema.digilockerConnection)
          .where(and(eq(schema.digilockerConnection.userId, ctx.authUserId), eq(schema.digilockerConnection.status, 'connected')))
          .limit(1);
        if (!row) {
          throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'DigiLocker not connected.' });
        }
        const access = decryptToken({ ciphertext: row.accessTokenEnc, secret: cfg.tokenSecret });
        const dl = await digilockerDownload({
          baseUrl: cfg.baseUrl,
          accessToken: access,
          uri: input.uri,
          maxBytes: MAX_IMPORT_BYTES,
        });
        const b64 = Buffer.from(dl.bytes).toString('base64');
        return { base64: b64, contentType: dl.contentType };
      }),

    linkVaultDocument: protectedProcedure
      .input(
        z.object({
          docId: z.string().min(1).max(512),
          vaultDocumentId: z.string().uuid(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const cfg = requireDigiLockerEnabled();
        const [conn] = await ctx.db
          .select()
          .from(schema.digilockerConnection)
          .where(and(eq(schema.digilockerConnection.userId, ctx.authUserId), eq(schema.digilockerConnection.status, 'connected')))
          .limit(1);
        if (!conn) {
          throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'DigiLocker not connected.' });
        }
        void cfg; // ensures requireDigiLockerEnabled was called
        await ctx.db
          .insert(schema.digilockerDocument)
          .values({
            connectionId: conn.id,
            docId: input.docId,
            vaultDocumentId: input.vaultDocumentId,
            fetchedAt: new Date(),
            createdAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [schema.digilockerDocument.connectionId, schema.digilockerDocument.docId],
            set: { vaultDocumentId: input.vaultDocumentId, fetchedAt: new Date() },
          });
        return { ok: true as const };
      }),
  }),
});

