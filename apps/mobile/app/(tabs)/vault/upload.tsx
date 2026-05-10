import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';

import { trpc } from '@jurisly/api-client';
import { MAX_VAULT_OBJECT_BYTES } from '@jurisly/storage';
import { encryptVaultPayload } from '@jurisly/vault-crypto';

export default function VaultUploadScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const requestUpload = trpc.vault.document.requestUpload.useMutation();
  const confirmUpload = trpc.vault.document.confirmUpload.useMutation();

  const [displayName, setDisplayName] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickAndUpload() {
    setError(null);
    if (!displayName.trim() || !passphrase.trim()) {
      setError('Display name and passphrase are required.');
      return;
    }
    setBusy(true);
    try {
      const pick = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (pick.canceled || !pick.assets?.[0]?.uri) {
        setBusy(false);
        return;
      }
      const uri = pick.assets[0].uri;
      const fileRes = await fetch(uri);
      const plain = new Uint8Array(await fileRes.arrayBuffer());

      const { ciphertext, wrappedDekBase64, keyWrapSaltBase64 } = await encryptVaultPayload(
        plain,
        passphrase,
      );
      if (ciphertext.byteLength > MAX_VAULT_OBJECT_BYTES) {
        throw new Error(`Encrypted file exceeds ${MAX_VAULT_OBJECT_BYTES} bytes.`);
      }

      const requested = await requestUpload.mutateAsync({
        displayName: displayName.trim(),
        folderId: null,
        category: 'other',
        tags: [],
        expiresAt: null,
        byteSize: ciphertext.byteLength,
        contentType: 'application/octet-stream',
      });

      const put = await fetch(requested.uploadUrl, {
        method: 'PUT',
        body: ciphertext as unknown as BodyInit,
        headers: { 'Content-Type': 'application/octet-stream' },
      });
      if (!put.ok) throw new Error(`Upload failed (${put.status}).`);

      await confirmUpload.mutateAsync({
        documentId: requested.documentId,
        wrappedDek: wrappedDekBase64,
        keyWrapSalt: keyWrapSaltBase64,
        byteSize: ciphertext.byteLength,
      });

      await utils.vault.document.list.invalidate();
      router.replace(`/(tabs)/vault/${requested.documentId}` as never);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Display name</Text>
      <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} />

      <Text style={[styles.label, { marginTop: 12 }]}>Vault passphrase</Text>
      <TextInput
        style={styles.input}
        value={passphrase}
        onChangeText={setPassphrase}
        secureTextEntry
      />

      <Text style={styles.hint}>Pick any file — it will be encrypted on-device before upload.</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.btn} onPress={() => void pickAndUpload()} disabled={busy}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Choose file & upload</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '600', color: '#44403C' },
  input: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#D6D3D1',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    color: '#1C1917',
  },
  hint: { marginTop: 12, fontSize: 13, color: '#57534E' },
  error: { marginTop: 12, color: '#b91c1c' },
  btn: {
    marginTop: 20,
    backgroundColor: '#C2410C',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
