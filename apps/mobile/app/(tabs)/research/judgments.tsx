import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { trpc } from '@kb/api-client';

export default function ResearchJudgmentsScreen() {
  const [draftQ, setDraftQ] = useState('');
  const [expand, setExpand] = useState(false);
  const [run, setRun] = useState({ query: '', expandQuery: false, seq: 0 });
  const search = trpc.research.judgments.search.useQuery(
    { query: run.query, limit: 20, expandQuery: run.expandQuery || undefined },
    { enabled: run.seq > 0 },
  );

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <Link href={'/(tabs)/research' as never}>
        <Text style={styles.back}>← Research</Text>
      </Link>
      <Text style={styles.title}>Judgments</Text>
      <TextInput style={styles.input} value={draftQ} onChangeText={setDraftQ} placeholder="Search…" />
      <View style={styles.row}>
        <Text style={styles.label}>Expand (AI)</Text>
        <Switch value={expand} onValueChange={setExpand} />
      </View>
      <Pressable
        style={styles.btn}
        onPress={() => setRun((s) => ({ query: draftQ, expandQuery: expand, seq: s.seq + 1 }))}
      >
        <Text style={styles.btnText}>Search</Text>
      </Pressable>
      {run.seq > 0 && search.isFetching ? <ActivityIndicator /> : null}
      {search.error ? <Text style={styles.err}>{search.error.message}</Text> : null}
      {(search.data?.hits ?? []).map((h) => (
        <Link key={h.id} href={`/(tabs)/research/${h.id}` as never} style={styles.hit}>
          <Text style={styles.hitTitle}>{h.title}</Text>
          <Text style={styles.hitMeta}>
            {h.citation} · {search.data?.source}
          </Text>
        </Link>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 20, gap: 12 },
  back: { color: '#C2410C', fontWeight: '600', marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '700', color: '#1C1917' },
  input: { borderWidth: 1, borderColor: '#D6D3D1', borderRadius: 10, padding: 10, fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 14, color: '#44403C' },
  btn: { backgroundColor: '#C2410C', padding: 12, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  err: { color: '#b91c1c' },
  hit: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E7E5E4', backgroundColor: '#fff' },
  hitTitle: { fontWeight: '700', color: '#1C1917' },
  hitMeta: { marginTop: 4, fontSize: 12, color: '#78716C' },
});
