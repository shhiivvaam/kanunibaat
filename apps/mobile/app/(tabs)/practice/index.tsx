import { Link } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { trpc } from '@jurisly/api-client';

export default function PracticeDashboardScreen() {
  const profile = trpc.profile.me.useQuery();
  const cases = trpc.cases.case.list.useQuery({});
  const range = useMemo(() => {
    const from = new Date();
    const to = new Date(from.getTime() + 7 * 86_400_000);
    return { from, to };
  }, []);
  const calendar = trpc.cases.calendar.upcoming.useQuery(range);

  if (profile.isPending) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const isLawyer = profile.data?.roles.includes('lawyer') ?? false;
  if (!isLawyer) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.warn}>
          Practice is for lawyers only. Complete lawyer onboarding or use a lawyer account.
        </Text>
      </ScrollView>
    );
  }

  const activeCases =
    cases.data?.cases.filter((c) => c.status !== 'closed' && c.status !== 'appealed').length ?? 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Practice</Text>
      <Text style={styles.muted}>Cases, clients, hearings, tasks.</Text>

      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Open cases</Text>
          <Text style={styles.statVal}>{cases.isPending ? '—' : String(activeCases)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={styles.statVal}>
            {cases.isPending ? '—' : String(cases.data?.cases.length ?? 0)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>7 days</Text>
          <Text style={styles.statVal}>
            {calendar.isPending
              ? '—'
              : String((calendar.data?.hearings.length ?? 0) + (calendar.data?.tasks.length ?? 0))}
          </Text>
        </View>
      </View>

      <Link href={'/(tabs)/practice/clients' as never} style={styles.btnSecondary}>
        <Text style={styles.btnSecondaryText}>Clients</Text>
      </Link>
      <Link href={'/(tabs)/practice/cases' as never} style={styles.btnPrimary}>
        <Text style={styles.btnPrimaryText}>All cases</Text>
      </Link>
      <Link href={'/(tabs)/practice/analytics' as never} style={styles.btnSecondary}>
        <Text style={styles.btnSecondaryText}>Analytics</Text>
      </Link>
      <Link href={'/(tabs)/practice/invoices' as never} style={styles.btnSecondary}>
        <Text style={styles.btnSecondaryText}>Invoices</Text>
      </Link>
      <Link href={'/(tabs)/practice/billing-settings' as never} style={styles.btnSecondary}>
        <Text style={styles.btnSecondaryText}>GST & firm</Text>
      </Link>

      <Text style={styles.sectionTitle}>Upcoming (7 days)</Text>
      {calendar.isError ? (
        <Text style={styles.error}>{calendar.error.message}</Text>
      ) : calendar.isPending ? (
        <ActivityIndicator />
      ) : (
        <View style={styles.list}>
          {(calendar.data?.hearings.length ?? 0) === 0 &&
          (calendar.data?.tasks.length ?? 0) === 0 ? (
            <Text style={styles.muted}>Nothing scheduled in this window.</Text>
          ) : null}
          {calendar.data?.hearings.map((h) => (
            <Text key={h.id} style={styles.row}>
              Hearing · {new Date(h.hearingAt).toLocaleString()} ·{' '}
              {h.case.courtName || h.case.caseType}
            </Text>
          ))}
          {calendar.data?.tasks.map((t) => (
            <Text key={t.id} style={styles.row}>
              Task · {t.title}
              {t.dueAt ? ` · due ${new Date(t.dueAt).toLocaleDateString()}` : ''}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: '#1C1917' },
  muted: { marginTop: 6, fontSize: 14, color: '#57534E' },
  warn: {
    fontSize: 14,
    color: '#92400e',
    backgroundColor: '#fffbeb',
    padding: 14,
    borderRadius: 12,
  },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 },
  statCard: {
    flex: 1,
    minWidth: 90,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    backgroundColor: '#fff',
  },
  statLabel: { fontSize: 11, fontWeight: '600', color: '#78716C', textTransform: 'uppercase' },
  statVal: { marginTop: 4, fontSize: 20, fontWeight: '700', color: '#1C1917' },
  btnSecondary: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D6D3D1',
    alignItems: 'center',
  },
  btnSecondaryText: { fontWeight: '700', color: '#44403C' },
  btnPrimary: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#C2410C',
    alignItems: 'center',
  },
  btnPrimaryText: { fontWeight: '700', color: '#fff' },
  sectionTitle: { marginTop: 28, fontSize: 15, fontWeight: '700', color: '#1C1917' },
  list: { marginTop: 10, gap: 8 },
  row: { fontSize: 13, color: '#44403C', lineHeight: 20 },
  error: { color: '#b91c1c', marginTop: 8 },
});
