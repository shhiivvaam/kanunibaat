import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
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
import { decryptVaultPayload } from '@jurisly/vault-crypto';

function formatUnknownDate(d: unknown): string {
  if (d instanceof Date) return d.toLocaleString();
  if (typeof d === 'string' || typeof d === 'number') {
    const x = new Date(d);
    return Number.isNaN(x.getTime()) ? String(d) : x.toLocaleString();
  }
  return '';
}

export default function VaultSharedMarketingScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const uuid = typeof token === 'string' ? token : '';

  const q = trpc.vault.share.get.useQuery(uuid ? { token: uuid } : (undefined as never), {
    enabled: Boolean(uuid),
    retry: false,
  });

  const [passphrase, setPassphrase] = useState('');
  const [decryptedPreview, setDecryptedPreview] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onDecryptPreview() {
    setErr(null);
    setDecryptedPreview(null);
    if (!q.data || !passphrase.trim()) {
      setErr('Enter the passphrase the owner shared with you.');
      return;
    }
    try {
      const res = await fetch(q.data.downloadUrl);
      if (!res.ok) throw new Error(`Download failed (${res.status}).`);
      const buf = new Uint8Array(await res.arrayBuffer());
      const plain = await decryptVaultPayload(
        buf,
        passphrase,
        q.data.wrappedDek,
        q.data.keyWrapSalt,
      );
      const preview = new TextDecoder('utf-8', { fatal: false }).decode(plain).slice(0, 4000);
      setDecryptedPreview(preview || '(No UTF-8 preview.)');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Decryption failed.');
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Shared vault' }} />
      <ScrollView contentContainerStyle={styles.container}>
        {!uuid ? <Text style={styles.err}>Invalid link.</Text> : null}
        {q.isPending ? <ActivityIndicator /> : null}
        {q.error ? <Text style={styles.err}>{q.error.message}</Text> : null}
        {!q.isPending && q.data ? (
          <View style={styles.card}>
            <Text style={styles.head}>{q.data.displayName}</Text>
            <Text style={styles.meta}>
              {String(q.data.category)} · {Math.round(q.data.byteSize / 1024)} KB ciphertext
            </Text>
            <Text style={styles.meta}>
              Share expires {formatUnknownDate(q.data.shareExpiresAt)}
            </Text>
            {q.data.documentExpiresAt ? (
              <Text style={styles.meta}>
                Document expiry {formatUnknownDate(q.data.documentExpiresAt)}
              </Text>
            ) : null}
            <Text style={styles.mini}>
              The owner may pass the passphrase offline; fragments in URLs are stripped from server
              logs where possible — always verify authenticity.
            </Text>
            <Text style={[styles.lbl, { marginTop: 10 }]}>Passphrase</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={passphrase}
              onChangeText={setPassphrase}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {err ? <Text style={styles.err}>{err}</Text> : null}
            <Pressable style={styles.btn} onPress={() => void onDecryptPreview()}>
              <Text style={styles.btnText}>Decrypt text preview</Text>
            </Pressable>
            {decryptedPreview ? (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.subhead}>Preview (first 4000 chars)</Text>
                <Text style={styles.preview}>{decryptedPreview}</Text>
              </View>
            ) : null}
            <Text style={[styles.mini, { marginTop: 14 }]}>
              Binary export matches the browser “Download decrypted” control on web for full
              fidelity.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  card: { gap: 6 },
  head: { fontSize: 20, fontWeight: '800', color: '#1C1917' },
  meta: { fontSize: 13, color: '#57534E' },
  mini: { fontSize: 11, color: '#78716C', lineHeight: 16 },
  lbl: { fontSize: 12, fontWeight: '700', color: '#1C1917' },
  input: {
    borderWidth: 1,
    borderColor: '#D6D3D1',
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
    fontSize: 15,
  },
  btn: {
    marginTop: 10,
    backgroundColor: '#C2410C',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  subhead: { fontSize: 14, fontWeight: '700', color: '#1C1917' },
  preview: { marginTop: 6, fontSize: 13, color: '#44403C', lineHeight: 20 },
  err: { color: '#B91C1C', fontSize: 13 },
});
