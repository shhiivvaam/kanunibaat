import { Link, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { trpc } from '@kb/api-client';

export default function ResearchJudgmentDetailScreen() {
  const { judgmentId } = useLocalSearchParams<{ judgmentId: string }>();
  const id = typeof judgmentId === 'string' ? judgmentId : '';
  const q = trpc.research.judgments.byId.useQuery({ id }, { enabled: Boolean(id) });
  const summarize = trpc.research.judgments.summarize.useMutation();
  const chain = trpc.research.citations.suggestChain.useMutation();
  const [extra, setExtra] = useState<string | null>(null);

  if (!id) {
    return <Text style={styles.err}>Invalid.</Text>;
  }
  if (q.isPending) {
    return <ActivityIndicator style={{ marginTop: 24 }} />;
  }
  if (q.isError) {
    return <Text style={styles.err}>{q.error.message}</Text>;
  }

  const j = q.data.judgment;

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <Link href={'/(tabs)/research/judgments' as never}>
        <Text style={styles.back}>← List</Text>
      </Link>
      <Text style={styles.title}>{j.title}</Text>
      <Text style={styles.meta}>
        {j.citation} · {j.court}
      </Text>
      <Text style={styles.body}>{j.summaryExcerpt}</Text>
      <Pressable style={styles.btn} disabled={summarize.isPending} onPress={() => void summarize.mutateAsync({ id })}>
        {summarize.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>AI summary</Text>}
      </Pressable>
      {summarize.error ? <Text style={styles.err}>{summarize.error.message}</Text> : null}
      {summarize.data ? (
        <Text style={styles.body}>{summarize.data.summary.summary}</Text>
      ) : null}
      <Pressable
        style={styles.btnSecondary}
        disabled={chain.isPending}
        onPress={async () => {
          setExtra(null);
          const r = await chain.mutateAsync({ seedCitation: j.citation });
          setExtra(JSON.stringify(r.nodes, null, 2));
        }}
      >
        <Text style={styles.btnSecondaryText}>Citation chain</Text>
      </Pressable>
      {chain.error ? <Text style={styles.err}>{chain.error.message}</Text> : null}
      {extra ? <Text style={styles.mono}>{extra}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 20, gap: 12 },
  back: { color: '#C2410C', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700', color: '#1C1917' },
  meta: { fontSize: 12, color: '#78716C' },
  body: { fontSize: 14, color: '#44403C', lineHeight: 20 },
  btn: { backgroundColor: '#C2410C', padding: 12, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  btnSecondary: { borderWidth: 1, borderColor: '#D6D3D1', padding: 12, borderRadius: 12, alignItems: 'center' },
  btnSecondaryText: { fontWeight: '700', color: '#44403C' },
  err: { color: '#b91c1c' },
  mono: { fontFamily: 'monospace', fontSize: 11, color: '#44403C' },
});
