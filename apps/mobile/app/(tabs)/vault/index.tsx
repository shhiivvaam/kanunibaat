import { Link, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { trpc } from '@kb/api-client';

export default function VaultListScreen() {
  const router = useRouter();
  const q = trpc.vault.document.list.useQuery(undefined, { staleTime: 10_000 });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Document vault</Text>
      <Text style={styles.muted}>Client-encrypted documents. Free tier limits apply.</Text>

      {q.isPending ? (
        <ActivityIndicator size="large" style={{ marginTop: 24 }} />
      ) : q.isError ? (
        <Text style={styles.error}>{q.error.message}</Text>
      ) : (
        <>
          <View style={styles.usage}>
            <Text style={styles.usageText}>
              {q.data.usage.completeCount} / {q.data.usage.maxDocuments} docs ·{' '}
              {Math.round(q.data.usage.totalBytes / 1024)} KB / {Math.round(q.data.usage.maxTotalBytes / (1024 * 1024))}{' '}
              MB
            </Text>
          </View>
          <Pressable style={styles.primaryBtn} onPress={() => router.push('/(tabs)/vault/upload' as never)}>
            <Text style={styles.primaryBtnText}>Upload</Text>
          </Pressable>
          {q.data.documents.length === 0 ? (
            <Text style={[styles.muted, { marginTop: 16 }]}>No documents yet.</Text>
          ) : (
            <View style={styles.list}>
              {q.data.documents.map((d) => (
                <Link key={d.id} href={`/(tabs)/vault/${d.id}` as never} style={styles.card}>
                  <Text style={styles.cardTitle}>{d.displayName}</Text>
                  <Text style={styles.cardMeta}>
                    {d.category} · {d.uploadStatus}
                    {d.expiringSoon ? ' · Expiring soon' : ''}
                  </Text>
                </Link>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: '#1C1917' },
  muted: { marginTop: 8, fontSize: 14, color: '#57534E' },
  error: { marginTop: 16, color: '#b91c1c' },
  usage: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  usageText: { fontSize: 13, color: '#44403C' },
  primaryBtn: {
    marginTop: 16,
    alignSelf: 'flex-start',
    backgroundColor: '#C2410C',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  list: { marginTop: 16, gap: 10 },
  card: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1C1917' },
  cardMeta: { marginTop: 4, fontSize: 12, color: '#78716C' },
});
