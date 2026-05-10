import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { trpc } from '@jurisly/api-client';

export default function ResearchLibraryScreen() {
  const [q, setQ] = useState('');
  const list = trpc.research.acts.list.useQuery({});
  const search = trpc.research.acts.search.useQuery(
    { query: q.trim() || undefined },
    { enabled: q.trim().length > 0 },
  );
  const acts = q.trim().length > 0 ? search.data?.acts : list.data?.acts;
  const loading = q.trim().length > 0 ? search.isFetching : list.isPending;

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <Link href={'/(tabs)/research' as never}>
        <Text style={styles.back}>← Research</Text>
      </Link>
      <Text style={styles.title}>Law library</Text>
      <TextInput style={styles.input} value={q} onChangeText={setQ} placeholder="Filter…" />
      {loading ? <ActivityIndicator /> : null}
      {(acts ?? []).map((a) => (
        <View key={a.id} style={styles.card}>
          <Text style={styles.cardTitle}>{a.shortTitle}</Text>
          <Text style={styles.cardMeta}>
            {a.category}
            {a.year ? ` · ${a.year}` : ''}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 20, gap: 10 },
  back: { color: '#C2410C', fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700', color: '#1C1917', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#D6D3D1', borderRadius: 10, padding: 10 },
  card: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    backgroundColor: '#fff',
  },
  cardTitle: { fontWeight: '700', color: '#1C1917' },
  cardMeta: { marginTop: 4, fontSize: 12, color: '#78716C' },
});
