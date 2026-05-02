import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { trpc } from '@jurisly/api-client';

function toYmd(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function PracticeAnalyticsScreen() {
  const [fromStr, setFromStr] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toYmd(d);
  });
  const [toStr, setToStr] = useState(() => toYmd(new Date()));

  const range = useMemo(() => {
    const from = new Date(`${fromStr}T00:00:00`);
    const to = new Date(`${toStr}T23:59:59.999`);
    return { from, to };
  }, [fromStr, toStr]);

  const summary = trpc.practice.analytics.summary.useQuery(range, {
    enabled: Boolean(fromStr && toStr),
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Analytics</Text>
      <Text style={styles.muted}>Range</Text>
      <TextInput
        style={styles.input}
        value={fromStr}
        onChangeText={setFromStr}
        placeholder="YYYY-MM-DD"
      />
      <TextInput
        style={[styles.input, { marginTop: 8 }]}
        value={toStr}
        onChangeText={setToStr}
        placeholder="YYYY-MM-DD"
      />

      {summary.isPending ? (
        <ActivityIndicator style={{ marginTop: 16 }} />
      ) : summary.isError ? (
        <Text style={styles.error}>{summary.error.message}</Text>
      ) : summary.data ? (
        <View style={{ marginTop: 16, gap: 10 }}>
          <Stat label="Active cases" value={String(summary.data.activeCases)} />
          <Stat label="Revenue paid (INR)" value={String(summary.data.revenuePaidInr)} />
          <Stat label="Billable hours" value={String(summary.data.billableHoursInRange)} />
          <Stat
            label="Win rate"
            value={summary.data.winRatePercent == null ? '—' : `${summary.data.winRatePercent}%`}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardVal}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: '#1C1917' },
  muted: { marginTop: 8, fontSize: 13, color: '#57534E' },
  input: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#D6D3D1',
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
  },
  card: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    backgroundColor: '#fff',
  },
  cardLabel: { fontSize: 11, fontWeight: '600', color: '#78716C', textTransform: 'uppercase' },
  cardVal: { marginTop: 4, fontSize: 18, fontWeight: '700', color: '#1C1917' },
  error: { color: '#b91c1c', marginTop: 12 },
});
