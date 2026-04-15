import { Link } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { trpc } from '@kb/api-client';

export default function ConsultationsListScreen() {
  const q = trpc.consultations.me.useQuery();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your consultations</Text>
        <Link href="/lawyers" style={styles.link}>
          Find a lawyer
        </Link>
      </View>

      {q.isPending ? (
        <ActivityIndicator size="large" />
      ) : q.isError ? (
        <Text style={styles.error}>{q.error.message}</Text>
      ) : (q.data?.length ?? 0) === 0 ? (
        <Text style={styles.muted}>No consultations yet.</Text>
      ) : (
        <View style={styles.list}>
          {q.data?.map((c) => (
            <Link
              key={c.id}
              href={`/(tabs)/consultations/${c.id}` as never}
              style={styles.card}
            >
              <Text style={styles.cardTitle}>
                {c.mode.toUpperCase()} · {c.status.replaceAll('_', ' ')}
              </Text>
              <Text style={styles.cardMeta}>
                {c.scheduledAt ? new Date(c.scheduledAt).toLocaleString() : 'Not scheduled'}
              </Text>
              <Text style={styles.cardBody} numberOfLines={2}>
                {c.issueSummary}
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
  header: { marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  title: { fontSize: 22, fontWeight: '700', color: '#1C1917' },
  link: { color: '#C2410C', fontWeight: '600' },
  list: { gap: 10 },
  card: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1C1917' },
  cardMeta: { fontSize: 12, color: '#78716C', marginTop: 4 },
  cardBody: { fontSize: 13, color: '#44403C', marginTop: 8, lineHeight: 18 },
  error: { color: '#B91C1C' },
  muted: { color: '#78716C' },
});

