import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { trpc } from '@jurisly/api-client';
import { decryptVaultPayload } from '@jurisly/vault-crypto';

export default function VaultDocumentScreen() {
  const { documentId } = useLocalSearchParams<{ documentId: string }>();
  const list = trpc.vault.document.list.useQuery(undefined, { enabled: Boolean(documentId) });
  const presign = trpc.vault.document.presignDownload.useMutation();
  const summarize = trpc.vault.document.summarize.useMutation();

  const doc = list.data?.documents.find((d) => d.id === documentId);
  const [passphrase, setPassphrase] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [decryptedPreview, setDecryptedPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function downloadDecrypted() {
    setError(null);
    if (!doc?.wrappedDek || !doc.keyWrapSalt || doc.uploadStatus !== 'complete') {
      setError('Document not ready.');
      return;
    }
    if (!passphrase.trim()) {
      setError('Passphrase required.');
      return;
    }
    try {
      const { downloadUrl } = await presign.mutateAsync({ documentId: doc.id });
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error(`Download failed (${res.status}).`);
      const buf = new Uint8Array(await res.arrayBuffer());
      const plain = await decryptVaultPayload(buf, passphrase, doc.wrappedDek, doc.keyWrapSalt);
      setDecryptedPreview(new TextDecoder('utf-8', { fatal: false }).decode(plain).slice(0, 4000));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed.');
    }
  }

  async function runSummary() {
    setError(null);
    setSummary(null);
    if (!doc?.wrappedDek || !doc.keyWrapSalt || doc.uploadStatus !== 'complete') {
      setError('Document not ready.');
      return;
    }
    if (!passphrase.trim()) {
      setError('Passphrase required.');
      return;
    }
    try {
      const { downloadUrl } = await presign.mutateAsync({ documentId: doc.id });
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error(`Download failed (${res.status}).`);
      const buf = new Uint8Array(await res.arrayBuffer());
      const plain = await decryptVaultPayload(buf, passphrase, doc.wrappedDek, doc.keyWrapSalt);
      const text = new TextDecoder('utf-8', { fatal: false }).decode(plain).slice(0, 16_000);
      const out = await summarize.mutateAsync({ plaintext: text || '(binary)', locale: 'en' });
      setSummary(`${out.summary}\n\n${out.bullets.map((b) => `• ${b}`).join('\n')}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Summary failed.');
    }
  }

  if (list.isPending || !documentId) {
    return (
      <View style={styles.centered}>
        <Text>Loading…</Text>
      </View>
    );
  }
  if (!doc) {
    return (
      <View style={styles.centered}>
        <Text>Document not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{doc.displayName}</Text>
      <Text style={styles.meta}>
        {doc.category} · {doc.uploadStatus}
      </Text>

      <Text style={styles.label}>Passphrase</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={passphrase}
        onChangeText={setPassphrase}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.secondary} onPress={() => void downloadDecrypted()}>
        <Text style={styles.secondaryText}>Decrypt preview (UTF-8)</Text>
      </Pressable>
      <Pressable style={styles.primary} onPress={() => void runSummary()}>
        <Text style={styles.primaryText}>AI summary</Text>
      </Pressable>

      {decryptedPreview ? <Text style={styles.summary}>{decryptedPreview}</Text> : null}
      {summary ? <Text style={styles.summary}>{summary}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: '700', color: '#1C1917' },
  meta: { marginTop: 6, fontSize: 13, color: '#78716C' },
  label: { marginTop: 16, fontSize: 13, fontWeight: '600' },
  input: { marginTop: 6, borderWidth: 1, borderColor: '#D6D3D1', borderRadius: 10, padding: 10 },
  error: { marginTop: 12, color: '#b91c1c' },
  secondary: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#D6D3D1',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryText: { fontWeight: '600', color: '#44403C' },
  primary: {
    marginTop: 10,
    backgroundColor: '#C2410C',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '700' },
  summary: { marginTop: 20, fontSize: 14, color: '#44403C' },
});
