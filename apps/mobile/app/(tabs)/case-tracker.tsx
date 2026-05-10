import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { trpc } from '@jurisly/api-client';

export default function CaseTrackerScreen() {
  const [cnr, setCnr] = useState('');
  const [submitted, setSubmitted] = useState<string | null>(null);

  const q = trpc.caseTracker.lookupByCnr.useQuery(
    { cnr: submitted ?? '' },
    { enabled: Boolean(submitted) },
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Case tracker (NJDG)</Text>
      <Text style={styles.sub}>Enter CNR to fetch latest public case status.</Text>

      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={cnr}
          onChangeText={setCnr}
          placeholder="ABCD123456789012"
          autoCapitalize="characters"
        />
        <Text style={styles.button} onPress={() => setSubmitted(cnr.trim())}>
          Lookup
        </Text>
      </View>

      {q.isLoading ? <Text style={styles.sub}>Loading…</Text> : null}
      {q.isError ? <Text style={styles.err}>{q.error.message}</Text> : null}
      {q.data ? (
        <View style={styles.card}>
          <Text style={styles.sub}>CNR: {q.data.cnr}</Text>
          <Text style={styles.json}>{JSON.stringify(q.data.snapshot, null, 2)}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  title: { fontSize: 20, fontWeight: '700' },
  sub: { fontSize: 14, color: '#444' },
  err: { fontSize: 14, color: '#b91c1c' },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10 },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#C2410C',
    color: 'white',
    borderRadius: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
  },
  json: { marginTop: 10, fontSize: 12, fontFamily: 'SpaceMono', color: '#111' },
});
