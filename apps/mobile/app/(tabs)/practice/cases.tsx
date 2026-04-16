import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { trpc } from '@kb/api-client';

const STATUSES = [
  'intake',
  'active',
  'hearing_scheduled',
  'pending_docs',
  'judgement',
  'closed',
  'appealed',
] as const;

export default function PracticeCasesScreen() {
  const [status, setStatus] = useState<(typeof STATUSES)[number] | ''>('');
  const q = trpc.cases.case.list.useQuery(status ? { status } : {});

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Link href={'/(tabs)/practice' as never} style={styles.back}>
          <Text style={styles.backText}>← Practice</Text>
        </Link>
        <Link href={'/(tabs)/practice/new-case' as never} style={styles.newLink}>
          <Text style={styles.newLinkText}>New case</Text>
        </Link>
      </View>
      <Text style={styles.title}>Cases</Text>

      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Status</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Text
            style={[styles.chip, !status && styles.chipOn]}
            onPress={() => setStatus('')}
          >
            All
          </Text>
          {STATUSES.map((s) => (
            <Text key={s} style={[styles.chip, status === s && styles.chipOn]} onPress={() => setStatus(s)}>
              {s}
            </Text>
          ))}
        </ScrollView>
      </View>

      {q.isPending ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : q.isError ? (
        <Text style={styles.error}>{q.error.message}</Text>
      ) : (
        <View style={{ marginTop: 16, gap: 10 }}>
          {(q.data?.cases ?? []).map((c) => (
            <Link key={c.id} href={`/(tabs)/practice/${c.id}` as never} style={styles.card}>
              <Text style={styles.cardTitle}>{c.courtName || c.caseType || 'Case'}</Text>
              <Text style={styles.cardMeta}>
                {c.status}
                {c.cnrNumber ? ` · CNR ${c.cnrNumber}` : ''}
              </Text>
            </Link>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  back: {},
  backText: { color: '#C2410C', fontWeight: '600' },
  newLink: {
    backgroundColor: '#C2410C',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  newLinkText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  title: { fontSize: 22, fontWeight: '700', color: '#1C1917', marginBottom: 12 },
  filterRow: { marginTop: 4 },
  filterLabel: { fontSize: 12, color: '#57534E', marginBottom: 6 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D6D3D1',
    fontSize: 11,
    color: '#44403C',
    overflow: 'hidden',
  },
  chipOn: { backgroundColor: '#1C1917', color: '#fff', borderColor: '#1C1917' },
  card: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1C1917' },
  cardMeta: { marginTop: 4, fontSize: 12, color: '#78716C' },
  error: { color: '#b91c1c', marginTop: 16 },
});
