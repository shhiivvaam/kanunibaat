import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { trpc } from '@jurisly/api-client';

export default function RightsScreen() {
  const router = useRouter();
  const [category, setCategory] = useState('');
  const [q, setQ] = useState('');
  const res = trpc.content.article.list.useQuery({
    category: category.trim() || undefined,
    q: q.trim() || undefined,
    limit: 30,
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Aapke Huqooq</Text>
      <Text style={styles.sub}>Rights & law explainers</Text>

      <View style={styles.filters}>
        <TextInput
          style={styles.input}
          placeholder="Category"
          value={category}
          onChangeText={setCategory}
        />
        <TextInput style={styles.input} placeholder="Search" value={q} onChangeText={setQ} />
      </View>

      {res.isLoading ? <Text style={styles.sub}>Loading…</Text> : null}
      {res.isError ? <Text style={styles.err}>{res.error.message}</Text> : null}

      <FlatList
        data={res.data?.items ?? []}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ gap: 10, paddingVertical: 12 }}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              router.push({ pathname: '/rights/[slug]', params: { slug: item.slug } })
            }
          >
            <Text style={styles.cardMeta}>{item.category || 'general'}</Text>
            <Text style={styles.cardTitle}>{item.titleJson.en ?? item.slug}</Text>
            <Text style={styles.cardMeta}>{item.lifeSituation}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          !res.isLoading ? <Text style={styles.sub}>No articles yet.</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  title: { fontSize: 20, fontWeight: '700' },
  sub: { fontSize: 13, color: '#444' },
  err: { fontSize: 13, color: '#b91c1c' },
  filters: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 10 },
  card: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
  },
  cardTitle: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  cardMeta: { fontSize: 12, color: '#666' },
});
