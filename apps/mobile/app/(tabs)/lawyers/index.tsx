import type { Href } from 'expo-router';
import { Link, Stack } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { trpc } from '@kb/api-client';

export default function LawyersListScreen() {
  const q = trpc.marketplace.searchLawyers.useQuery({ query: '', limit: 30 });

  return (
    <>
      <Stack.Screen options={{ title: 'Find lawyers' }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.lead}>
          Verified advocates on KanuniBaat. Search is powered by the API (Meilisearch when configured, Postgres
          fallback).
        </Text>
        {q.isPending ? (
          <ActivityIndicator size="large" />
        ) : q.isError ? (
          <Text style={styles.error}>{q.error.message}</Text>
        ) : (
          <View style={styles.list}>
            {(q.data?.hits ?? []).map((h) => (
              <Link
                key={h.userId}
                href={`/(tabs)/lawyers/${h.slug}` as Href}
                style={styles.link}
              >
                {h.displayName ?? 'Lawyer'} — {h.city ?? h.barState ?? 'India'}
              </Link>
            ))}
          </View>
        )}
        {!q.isPending && !q.isError && (q.data?.hits.length ?? 0) === 0 ? (
          <Text style={styles.muted}>No verified lawyers listed yet.</Text>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  lead: { fontSize: 14, color: '#44403C', marginBottom: 16, lineHeight: 20 },
  list: { gap: 12 },
  link: { fontSize: 16, color: '#C2410C', fontWeight: '600' },
  error: { color: '#B91C1C' },
  muted: { color: '#78716C', marginTop: 12 },
});
