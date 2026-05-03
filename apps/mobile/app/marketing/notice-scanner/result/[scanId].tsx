import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { trpc } from '@jurisly/api-client';

function qp(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (Array.isArray(v)) return typeof v[0] === 'string' ? v[0] : undefined;
  return typeof v === 'string' ? v : undefined;
}

export default function MarketingNoticeScanResultScreen() {
  const { scanId, t } = useLocalSearchParams<{ scanId: string; t?: string | string[] }>();
  const token = typeof t === 'string' ? t : Array.isArray(t) ? t[0] : qp(t);

  const q = trpc.notices.get.useQuery(
    token && scanId ? { scanId, accessToken: token } : (undefined as never),
    { enabled: Boolean(token && scanId), retry: false },
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Notice result' }} />
      <ScrollView contentContainerStyle={styles.container}>
        {!token ? <Text style={styles.err}>Missing access token (`t` query param).</Text> : null}
        {q.isPending ? <ActivityIndicator /> : null}
        {q.error ? <Text style={styles.err}>{q.error.message}</Text> : null}
        {!q.isPending && q.data?.scan ? (
          <View style={styles.card}>
            <Text style={styles.meta}>Status: {String(q.data.scan.status)}</Text>
            {q.data.scan.failureReason ? (
              <Text style={styles.err}>{String(q.data.scan.failureReason)}</Text>
            ) : null}
            {q.data.scan.aiSummary ? (
              <Text style={styles.summary}>{String(q.data.scan.aiSummary)}</Text>
            ) : null}
            {Array.isArray(q.data.scan.recommendedActions) &&
            q.data.scan.recommendedActions.length > 0 ? (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.subhead}>Suggested actions</Text>
                {q.data.scan.recommendedActions.map((a: string, i: number) => (
                  <Text key={`${i}:${a}`} style={styles.olItem}>
                    {i + 1}. {a}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
        {!q.isPending && token && !q.data?.scan ? (
          <Text style={styles.muted}>Not found.</Text>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, paddingBottom: 40 },
  card: {
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 14,
    padding: 16,
    gap: 8,
    backgroundColor: '#fff',
  },
  meta: { fontSize: 12, color: '#78716C' },
  summary: { marginTop: 8, fontSize: 14, color: '#44403C', lineHeight: 21 },
  subhead: { fontSize: 13, fontWeight: '700', color: '#1C1917' },
  olItem: { fontSize: 13, color: '#44403C', marginTop: 4 },
  err: { color: '#B91C1C', fontSize: 13 },
  muted: { fontSize: 13, color: '#78716C' },
});
