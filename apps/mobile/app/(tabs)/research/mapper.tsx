import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { trpc } from '@kb/api-client';

export default function ResearchMapperScreen() {
  const [source, setSource] = useState('IPC');
  const [section, setSection] = useState('302');
  const [target, setTarget] = useState('BNS');
  const [submitted, setSubmitted] = useState<{
    sourceStatute: string;
    sourceSection: string;
    targetStatute?: string;
  } | null>(null);
  const q = trpc.research.statutes.crosswalk.useQuery(
    {
      sourceStatute: submitted?.sourceStatute ?? 'IPC',
      sourceSection: submitted?.sourceSection ?? '302',
      targetStatute: submitted?.targetStatute,
    },
    { enabled: submitted !== null },
  );

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <Link href={'/(tabs)/research' as never}>
        <Text style={styles.back}>← Research</Text>
      </Link>
      <Text style={styles.title}>Crosswalk</Text>
      <TextInput style={styles.input} value={source} onChangeText={setSource} placeholder="IPC" />
      <TextInput style={styles.input} value={section} onChangeText={setSection} placeholder="302" />
      <TextInput style={styles.input} value={target} onChangeText={setTarget} placeholder="BNS" />
      <Pressable
        style={styles.btn}
        onPress={() =>
          setSubmitted({
            sourceStatute: source.trim(),
            sourceSection: section.trim(),
            targetStatute: target.trim() || undefined,
          })
        }
      >
        <Text style={styles.btnText}>Lookup</Text>
      </Pressable>
      {submitted !== null && q.isFetching ? <ActivityIndicator /> : null}
      {q.error ? <Text style={styles.err}>{q.error.message}</Text> : null}
      {(q.data?.rows ?? []).map((r) => (
        <View key={`${r.sourceStatute}-${r.sourceSection}-${r.targetStatute}`} style={styles.card}>
          <Text style={styles.cardTitle}>
            {r.sourceStatute} {r.sourceSection} → {r.targetStatute} {r.targetSection}
          </Text>
          <Text style={styles.cardMeta}>{r.note}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 20, gap: 10 },
  back: { color: '#C2410C', fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700', color: '#1C1917' },
  input: { borderWidth: 1, borderColor: '#D6D3D1', borderRadius: 10, padding: 10 },
  btn: { backgroundColor: '#C2410C', padding: 12, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  err: { color: '#b91c1c' },
  card: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E7E5E4', backgroundColor: '#fff' },
  cardTitle: { fontWeight: '700', fontSize: 14, color: '#1C1917' },
  cardMeta: { marginTop: 4, fontSize: 12, color: '#57534E' },
});
