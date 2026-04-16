import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { trpc } from '@kb/api-client';

export default function LegalQaScreen() {
  const router = useRouter();
  const [category, setCategory] = useState('');
  const [q, setQ] = useState('');
  const list = trpc.qa.question.list.useQuery({ category: category.trim() || undefined, q: q.trim() || undefined, limit: 30 });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Legal Q&A</Text>
          <Text style={styles.sub}>Ask. Lawyers answer. AI preview.</Text>
        </View>
        <Pressable style={styles.primaryBtn} onPress={() => router.push('/legal-qa/ask' as any)}>
          <Text style={styles.primaryBtnText}>Ask</Text>
        </Pressable>
      </View>

      <View style={styles.filters}>
        <TextInput style={styles.input} placeholder="Category" value={category} onChangeText={setCategory} />
        <TextInput style={styles.input} placeholder="Search titles" value={q} onChangeText={setQ} />
      </View>

      {list.isLoading ? <Text style={styles.sub}>Loading…</Text> : null}
      {list.isError ? <Text style={styles.err}>{list.error.message}</Text> : null}

      <FlatList
        data={list.data?.items ?? []}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ gap: 10, paddingVertical: 12 }}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/legal-qa/${item.id}` as any)}>
            <Text style={styles.cardMeta}>
              {item.category || 'general'} · {item.answersCount} answers · {item.votesUp} upvotes
            </Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardBody} numberOfLines={2}>
              {item.body}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={!list.isLoading ? <Text style={styles.sub}>No questions yet.</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  header: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  sub: { fontSize: 13, color: '#444' },
  err: { fontSize: 13, color: '#b91c1c' },
  filters: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 10 },
  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 12, backgroundColor: '#fff' },
  cardTitle: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  cardMeta: { fontSize: 12, color: '#666' },
  cardBody: { fontSize: 13, color: '#444', marginTop: 4 },
  primaryBtn: { backgroundColor: '#C2410C', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
});

