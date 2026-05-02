import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { trpc } from '@jurisly/api-client';
import { MAX_VAULT_OBJECT_BYTES } from '@jurisly/storage';
import { encryptVaultPayload } from '@jurisly/vault-crypto';

import { absoluteWebAppHref } from '@/lib/web-app-url';
import { base64ToUint8Array } from '@/lib/base64-to-bytes';
import { useLocale } from '@/src/i18n';

function qp(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (Array.isArray(v)) return typeof v[0] === 'string' ? v[0] : undefined;
  return typeof v === 'string' ? v : undefined;
}

export default function IntegrationsScreen() {
  const router = useRouter();
  const locale = useLocale();
  const dlStatus = trpc.integrations.digilocker.status.useQuery();
  const dlGetAuth = trpc.integrations.digilocker.getAuthUrl.useMutation();
  const dlList = trpc.integrations.digilocker.listDocuments.useQuery(undefined, {
    enabled: dlStatus.data?.enabled === true && dlStatus.data?.connected === true,
  });
  const dlDownload = trpc.integrations.digilocker.downloadBase64.useMutation();
  const dlLink = trpc.integrations.digilocker.linkVaultDocument.useMutation();
  const requestUpload = trpc.vault.document.requestUpload.useMutation();
  const confirmUpload = trpc.vault.document.confirmUpload.useMutation();
  const utils = trpc.useUtils();

  const [connectBusy, setConnectBusy] = useState(false);
  const [connectErr, setConnectErr] = useState<string | null>(null);

  const [dlSelectedUri, setDlSelectedUri] = useState('');
  const [dlDisplayName, setDlDisplayName] = useState('');
  const [dlPassphrase, setDlPassphrase] = useState('');
  const [dlError, setDlError] = useState<string | null>(null);
  const [dlBusy, setDlBusy] = useState(false);

  const exchange = trpc.integrations.digilocker.exchangeCode.useMutation({
    onSuccess: () => void utils.integrations.digilocker.status.invalidate(),
  });

  const dlPreviewItems = useMemo(
    () => (dlList.data?.items ?? []).slice(0, 24),
    [dlList.data?.items],
  );

  async function onConnectDigiLocker() {
    setConnectErr(null);
    const returnUrl = absoluteWebAppHref(`/${locale}/app/integrations/digilocker/callback`);
    try {
      const out = await dlGetAuth.mutateAsync();
      setConnectBusy(true);
      const browserRes = await WebBrowser.openAuthSessionAsync(out.url, returnUrl);
      if (browserRes.type === 'dismiss' || browserRes.type === 'cancel') return;
      if (browserRes.type !== 'success' || !browserRes.url) {
        setConnectErr('DigiLocker authorization was not completed.');
        return;
      }
      const parsed = Linking.parse(browserRes.url);
      const code = qp(parsed.queryParams?.code);
      const state = qp(parsed.queryParams?.state);
      const err = qp(parsed.queryParams?.error);
      if (err) {
        setConnectErr(`DigiLocker error: ${err}`);
        return;
      }
      if (!code || !state) {
        setConnectErr('Missing DigiLocker callback parameters.');
        return;
      }
      await exchange.mutateAsync({ code, state });
    } catch (e) {
      setConnectErr(e instanceof Error ? e.message : 'Failed to connect DigiLocker.');
    } finally {
      setConnectBusy(false);
    }
  }

  async function onImportSelected() {
    setDlError(null);
    if (!dlSelectedUri) {
      setDlError('Pick a DigiLocker document.');
      return;
    }
    if (!dlDisplayName.trim()) {
      setDlError('Enter a display name.');
      return;
    }
    if (!dlPassphrase.trim()) {
      setDlError('Enter your vault passphrase (never sent to server).');
      return;
    }
    setDlBusy(true);
    try {
      const dl = await dlDownload.mutateAsync({ uri: dlSelectedUri });
      const bytes = base64ToUint8Array(dl.base64);
      const { ciphertext, wrappedDekBase64, keyWrapSaltBase64 } = await encryptVaultPayload(
        bytes,
        dlPassphrase,
      );
      if (ciphertext.byteLength > MAX_VAULT_OBJECT_BYTES) {
        throw new Error(`Encrypted file exceeds ${MAX_VAULT_OBJECT_BYTES} bytes.`);
      }

      const requested = await requestUpload.mutateAsync({
        displayName: dlDisplayName.trim(),
        folderId: null,
        category: 'identity',
        tags: ['digilocker'],
        expiresAt: null,
        byteSize: ciphertext.byteLength,
        contentType: 'application/pdf',
      });

      const body = new Uint8Array(ciphertext.byteLength);
      body.set(ciphertext);
      const put = await fetch(requested.uploadUrl, {
        method: 'PUT',
        body: body as unknown as BodyInit,
        headers: { 'Content-Type': 'application/octet-stream' },
      });
      if (!put.ok) throw new Error(`Upload failed (${put.status}).`);

      await confirmUpload.mutateAsync({
        documentId: requested.documentId,
        wrappedDek: wrappedDekBase64,
        keyWrapSalt: keyWrapSaltBase64,
        byteSize: ciphertext.byteLength,
      });

      await dlLink.mutateAsync({ docId: dlSelectedUri, vaultDocumentId: requested.documentId });
      await utils.vault.document.list.invalidate();
      router.replace(`/(tabs)/vault/${requested.documentId}`);
    } catch (e) {
      setDlError(e instanceof Error ? e.message : 'Import failed.');
    } finally {
      setDlBusy(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Integrations' }} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.cardTitle}>DigiLocker</Text>
            {dlStatus.data?.enabled && dlStatus.data?.connected ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Connected</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.cardSub}>
            Import identity documents from DigiLocker into your encrypted vault. Files are encrypted
            on-device before upload.
          </Text>

          {!dlStatus.data?.enabled ? (
            <View style={styles.warnBanner}>
              <Text style={styles.warnText}>DigiLocker is not enabled for this workspace.</Text>
            </View>
          ) : null}

          {dlStatus.data?.enabled && !dlStatus.data?.connected ? (
            <Pressable
              style={styles.primaryBtn}
              disabled={dlGetAuth.isPending || connectBusy || exchange.isPending}
              onPress={() => void onConnectDigiLocker()}
            >
              {dlGetAuth.isPending || connectBusy || exchange.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Connect DigiLocker</Text>
              )}
            </Pressable>
          ) : null}

          {connectErr ? <Text style={styles.err}>{connectErr}</Text> : null}
          {dlGetAuth.error ? <Text style={styles.err}>{dlGetAuth.error.message}</Text> : null}

          {dlStatus.data?.enabled && dlStatus.data?.connected ? (
            <>
              <Text style={[styles.label, { marginTop: 12 }]}>Select document</Text>
              {dlList.isPending ? <ActivityIndicator /> : null}
              {dlList.error ? <Text style={styles.err}>{dlList.error.message}</Text> : null}
              <ScrollView horizontal style={{ marginTop: 6 }} nestedScrollEnabled>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, maxWidth: 600 }}>
                  {dlPreviewItems.map((i, idx) => {
                    const uri = i.uri ?? '';
                    const id = uri || String(i.id ?? idx);
                    const selected = dlSelectedUri === uri;
                    return (
                      <Pressable
                        key={id}
                        onPress={() => setDlSelectedUri(uri)}
                        style={[styles.chip, selected && styles.chipSelected]}
                      >
                        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                          {(i.name ?? i.id ?? 'Document') + (i.type ? ` · ${i.type}` : '')}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
              <Text style={styles.mini}>Import limit: 2 MB per document</Text>

              <Text style={[styles.label, { marginTop: 10 }]}>Display name</Text>
              <TextInput style={styles.input} value={dlDisplayName} onChangeText={setDlDisplayName} />
              <Text style={[styles.label, { marginTop: 8 }]}>Vault passphrase</Text>
              <TextInput
                style={styles.input}
                value={dlPassphrase}
                onChangeText={setDlPassphrase}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Pressable style={styles.primaryBtn} onPress={() => void onImportSelected()} disabled={dlBusy}>
                {dlBusy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Encrypt and import to vault</Text>
                )}
              </Pressable>
            </>
          ) : null}

          {dlError ? <Text style={styles.err}>{dlError}</Text> : null}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 36 },
  card: {
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 14,
    padding: 16,
    gap: 8,
    backgroundColor: '#fff',
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1C1917' },
  cardSub: { fontSize: 13, color: '#57534E', lineHeight: 19 },
  badge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#065F46' },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: '#C2410C',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  warnBanner: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 10,
  },
  warnText: { fontSize: 13, color: '#78350F' },
  label: { fontSize: 12, fontWeight: '700', color: '#1C1917' },
  input: {
    borderWidth: 1,
    borderColor: '#D6D3D1',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    marginTop: 4,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#D6D3D1',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    marginBottom: 4,
  },
  chipSelected: { borderColor: '#C2410C', backgroundColor: '#FFF7ED' },
  chipText: { fontSize: 12, color: '#44403C' },
  chipTextSelected: { color: '#C2410C', fontWeight: '700' },
  mini: { fontSize: 11, color: '#78716C', marginTop: 4 },
  err: { fontSize: 13, color: '#B91C1C', marginTop: 4 },
});
