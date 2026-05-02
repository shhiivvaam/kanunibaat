import { randomUUID } from 'node:crypto';

import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import {
  lawyerAvailability,
  lawyerDocument,
  lawyerProfile,
  user,
  userProfile,
} from '@jurisly/database/schema';
import {
  lawyerDocumentObjectKey,
  presignPutObject,
  StorageNotConfiguredError,
  StorageValidationError,
} from '@jurisly/storage';
import { syncLawyerMeiliFromDb } from '@jurisly/search';

import { lawyerProcedure, protectedProcedure, router } from '../init';
import { lawyerHasRequiredDocuments } from '../lawyer-documents';
import { allocateLawyerSlug } from '../lawyer-slug';
import {
  ensureDefaultUserRole,
  ensureLawyerRole,
  ensureUserProfileRow,
  loadProfileBundle,
} from '../profile-service';
import { verifyEnrollment, getBarCouncilVerificationStatus } from '../integrations/bar-council';

const documentKindSchema = z.enum(['enrollment_certificate', 'government_id']);

const requestUploadSchema = z.object({
  kind: documentKindSchema,
  fileName: z.string().min(1).max(200),
  contentType: z.string().min(1).max(120),
  byteSize: z.number().int().positive(),
});

const confirmUploadSchema = z.object({
  documentId: z.string().uuid(),
});

const updateOnboardingSchema = z.object({
  headline: z.string().max(200).optional(),
  bio: z.string().max(4000).optional(),
  city: z.string().max(120).optional().nullable(),
  practiceAreas: z.array(z.string().max(80)).max(40).optional(),
  languages: z.array(z.string().max(40)).max(20).optional(),
  yearsExperience: z.number().int().min(0).max(80).optional().nullable(),
  barState: z.string().max(64).optional().nullable(),
  enrollmentNumber: z.string().max(128).optional().nullable(),
});

const availabilitySlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startMinute: z.number().int().min(0).max(1440),
  endMinute: z.number().int().min(0).max(1440),
  timezone: z.string().min(1).max(64).optional(),
});

const setAvailabilitySchema = z.object({
  slots: z.array(availabilitySlotSchema).max(50),
});

export const lawyerRouter = router({
  bootstrap: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.authUserId;
    const [u] = await ctx.db.select().from(user).where(eq(user.id, userId)).limit(1);
    if (!u) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' });
    }
    await ensureDefaultUserRole(ctx.db, userId);
    await ensureUserProfileRow(ctx.db, userId, u.name);
    await ensureLawyerRole(ctx.db, userId);

    const [existing] = await ctx.db
      .select()
      .from(lawyerProfile)
      .where(eq(lawyerProfile.userId, userId))
      .limit(1);
    if (!existing) {
      const [p] = await ctx.db
        .select()
        .from(userProfile)
        .where(eq(userProfile.userId, userId))
        .limit(1);
      const slug = await allocateLawyerSlug(ctx.db, p?.displayName ?? u.name, userId);
      await ctx.db.insert(lawyerProfile).values({
        userId,
        slug,
        verificationStatus: 'draft',
      });
    }

    const bundle = await loadProfileBundle(ctx.db, userId);
    if (!bundle) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Profile load failed.' });
    }
    return bundle;
  }),

  updateOnboarding: lawyerProcedure
    .input(updateOnboardingSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.authUserId;
      const [law] = await ctx.db
        .select()
        .from(lawyerProfile)
        .where(eq(lawyerProfile.userId, userId))
        .limit(1);
      if (!law) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Call lawyer.bootstrap first.',
        });
      }
      if (law.verificationStatus === 'pending') {
        throw new TRPCError({ code: 'CONFLICT', message: 'Profile is pending review.' });
      }
      if (law.verificationStatus === 'verified') {
        // Allow limited edits post-verify; still sync search index
      }

      const patch: Partial<typeof lawyerProfile.$inferInsert> = { updatedAt: new Date() };
      if (input.headline !== undefined) patch.headline = input.headline;
      if (input.bio !== undefined) patch.bio = input.bio;
      if (input.city !== undefined) patch.city = input.city;
      if (input.practiceAreas !== undefined) patch.practiceAreas = input.practiceAreas;
      if (input.languages !== undefined) patch.languages = input.languages;
      if (input.yearsExperience !== undefined) patch.yearsExperience = input.yearsExperience;
      if (input.barState !== undefined) patch.barState = input.barState;
      if (input.enrollmentNumber !== undefined) patch.enrollmentNumber = input.enrollmentNumber;

      await ctx.db.update(lawyerProfile).set(patch).where(eq(lawyerProfile.userId, userId));

      if (law.verificationStatus === 'verified') {
        await syncLawyerMeiliFromDb(ctx.db, ctx.meili, ctx.meiliIndexName, userId);
      }

      const bundle = await loadProfileBundle(ctx.db, userId);
      if (!bundle) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Profile load failed.' });
      }
      return bundle;
    }),

  listDocuments: lawyerProcedure.query(async ({ ctx }) => {
    const userId = ctx.authUserId;
    const rows = await ctx.db
      .select({
        id: lawyerDocument.id,
        kind: lawyerDocument.kind,
        fileName: lawyerDocument.fileName,
        contentType: lawyerDocument.contentType,
        byteSize: lawyerDocument.byteSize,
        uploadedAt: lawyerDocument.uploadedAt,
        createdAt: lawyerDocument.createdAt,
      })
      .from(lawyerDocument)
      .where(eq(lawyerDocument.userId, userId));
    return { documents: rows };
  }),

  requestDocumentUpload: lawyerProcedure
    .input(requestUploadSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.s3Documents) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: new StorageNotConfiguredError().message,
        });
      }
      const userId = ctx.authUserId;
      const [law] = await ctx.db
        .select()
        .from(lawyerProfile)
        .where(eq(lawyerProfile.userId, userId))
        .limit(1);
      if (!law) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Call lawyer.bootstrap first.',
        });
      }
      if (law.verificationStatus === 'pending' || law.verificationStatus === 'verified') {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Documents cannot be changed in the current status.',
        });
      }

      const id = randomUUID();
      const storageKey = lawyerDocumentObjectKey(userId, id, input.fileName);

      await ctx.db.insert(lawyerDocument).values({
        id,
        userId,
        kind: input.kind,
        storageKey,
        fileName: input.fileName,
        contentType: input.contentType,
        byteSize: input.byteSize,
      });

      try {
        const { url } = await presignPutObject(ctx.s3Documents, {
          key: storageKey,
          contentType: input.contentType,
          contentLength: input.byteSize,
        });

        return { documentId: id, uploadUrl: url, storageKey };
      } catch (e) {
        await ctx.db.delete(lawyerDocument).where(eq(lawyerDocument.id, id));
        if (e instanceof StorageValidationError) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: e.message });
        }
        throw e;
      }
    }),

  confirmDocumentUpload: lawyerProcedure
    .input(confirmUploadSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.authUserId;
      const [row] = await ctx.db
        .select()
        .from(lawyerDocument)
        .where(and(eq(lawyerDocument.id, input.documentId), eq(lawyerDocument.userId, userId)))
        .limit(1);
      if (!row) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found.' });
      }
      await ctx.db
        .update(lawyerDocument)
        .set({ uploadedAt: new Date() })
        .where(eq(lawyerDocument.id, input.documentId));
      return { ok: true as const };
    }),

  submitForReview: lawyerProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.authUserId;
    const [law] = await ctx.db
      .select()
      .from(lawyerProfile)
      .where(eq(lawyerProfile.userId, userId))
      .limit(1);
    if (!law) {
      throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Call lawyer.bootstrap first.' });
    }
    if (law.verificationStatus !== 'draft' && law.verificationStatus !== 'rejected') {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Only draft or rejected profiles can be submitted.',
      });
    }
    if (!law.barState?.trim() || !law.enrollmentNumber?.trim()) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Bar council state and enrollment number are required before submission.',
      });
    }
    const docsOk = await lawyerHasRequiredDocuments(ctx.db, userId);
    if (!docsOk) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Enrollment certificate and government ID must be uploaded before submission.',
      });
    }

    // Attempt automated Bar Council verification (non-blocking)
    let autoVerified = false;
    try {
      const configStatus = getBarCouncilVerificationStatus();
      if (configStatus.enabled && law.barState && law.enrollmentNumber) {
        const [p] = await ctx.db
          .select()
          .from(userProfile)
          .where(eq(userProfile.userId, userId))
          .limit(1);
        const result = verifyEnrollment({
          state: law.barState,
          enrollmentNumber: law.enrollmentNumber,
          name: p?.displayName ?? '',
        });

        if (result.status === 'verified') {
          autoVerified = true;
        }
      }
    } catch (error) {
      // Log error but don't block submission - fall back to manual verification
      console.error('Bar Council verification attempt failed:', error);
    }

    await ctx.db
      .update(lawyerProfile)
      .set({
        verificationStatus: autoVerified ? 'verified' : 'pending',
        rejectionReason: null,
        updatedAt: new Date(),
      })
      .where(eq(lawyerProfile.userId, userId));

    if (autoVerified) {
      await syncLawyerMeiliFromDb(ctx.db, ctx.meili, ctx.meiliIndexName, userId);
    }

    const bundle = await loadProfileBundle(ctx.db, userId);
    if (!bundle) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Profile load failed.' });
    }
    return bundle;
  }),

  listAvailability: lawyerProcedure.query(async ({ ctx }) => {
    const userId = ctx.authUserId;
    const rows = await ctx.db
      .select()
      .from(lawyerAvailability)
      .where(eq(lawyerAvailability.userId, userId));
    return { slots: rows };
  }),

  setAvailability: lawyerProcedure.input(setAvailabilitySchema).mutation(async ({ ctx, input }) => {
    for (const s of input.slots) {
      if (s.endMinute <= s.startMinute) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Each slot must have endMinute greater than startMinute.',
        });
      }
    }
    const userId = ctx.authUserId;
    await ctx.db.delete(lawyerAvailability).where(eq(lawyerAvailability.userId, userId));
    if (input.slots.length > 0) {
      await ctx.db.insert(lawyerAvailability).values(
        input.slots.map((s) => ({
          userId,
          dayOfWeek: s.dayOfWeek,
          startMinute: s.startMinute,
          endMinute: s.endMinute,
          timezone: s.timezone ?? 'Asia/Kolkata',
        })),
      );
    }
    return { ok: true as const };
  }),

  checkBarCouncilVerification: lawyerProcedure.query(async ({ ctx }) => {
    const userId = ctx.authUserId;
    const [law] = await ctx.db
      .select()
      .from(lawyerProfile)
      .where(eq(lawyerProfile.userId, userId))
      .limit(1);
    if (!law) {
      throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Call lawyer.bootstrap first.' });
    }

    const configStatus = getBarCouncilVerificationStatus();

    if (!configStatus.enabled) {
      return {
        available: false,
        reason: configStatus.reason,
        canVerify: false,
      };
    }

    if (!law.barState?.trim() || !law.enrollmentNumber?.trim()) {
      return {
        available: true,
        canVerify: false,
        reason: 'Bar council state and enrollment number are required.',
      };
    }

    const [p] = await ctx.db
      .select()
      .from(userProfile)
      .where(eq(userProfile.userId, userId))
      .limit(1);

    const result = verifyEnrollment({
      state: law.barState,
      enrollmentNumber: law.enrollmentNumber,
      name: p?.displayName ?? '',
    });

    return {
      available: true,
      canVerify: true,
      verificationResult: result,
    };
  }),
});
