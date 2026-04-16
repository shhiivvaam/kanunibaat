import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { trpc } from '@kb/api-client';

export default function RightsDetailScreen() {
  const params = useLocalSearchParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';

  const q = trpc.content.article.bySlug.useQuery({ slug }, { enabled: Boolean(slug) });
  const inc = trpc.content.article.incrementViews.useMutation();

  useEffect(() => {
    if (!slug) return;
    void inc.mutateAsync({ slug });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const a = q.data?.article;
  const title = a?.titleJson?.en ?? slug;
  const body = a?.bodyJson?.en ?? '';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>{a?.category || 'general'}</Text>
      {q.isLoading ? <Text style={styles.sub}>Loading…</Text> : null}
      {q.isError ? <Text style={styles.err}>{q.error.message}</Text> : null}
      {a ? (
        <View style={styles.card}>
          <Text style={styles.body}>{body}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  title: { fontSize: 20, fontWeight: '700' },
  sub: { fontSize: 13, color: '#444' },
  err: { fontSize: 13, color: '#b91c1c' },
  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 12, backgroundColor: '#fff' },
  body: { fontSize: 14, lineHeight: 20, color: '#111' },
});

