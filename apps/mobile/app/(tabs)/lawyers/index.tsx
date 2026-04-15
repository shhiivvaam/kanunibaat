import type { Href } from 'expo-router';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { trpc } from '@kb/api-client';

export default function LawyersListScreen() {
  const params = useLocalSearchParams<{ q?: string | string[] }>();
  const urlQ = typeof params.q === 'string' ? params.q : '';
  const [search, setSearch] = useState(urlQ);
  const [debounced, setDebounced] = useState(urlQ.trim());

  useEffect(() => {
    setSearch(urlQ);
    setDebounced(urlQ.trim());
  }, [urlQ]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const q = trpc.marketplace.searchLawyers.useQuery({ query: debounced, limit: 30 });

  return (
    <>
      <Stack.Screen options={{ title: 'Find lawyers' }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.lead}>
          Verified advocates on KanuniBaat. Search is powered by the API (Meilisearch when configured, Postgres
          fallback).
        </Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, city, practice…"
          style={styles.search}
        />
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
  lead: { fontSize: 14, color: '#44403C', marginBottom: 12, lineHeight: 20 },
  search: {
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  list: { gap: 12 },
  link: { fontSize: 16, color: '#C2410C', fontWeight: '600' },
  error: { color: '#B91C1C' },
  muted: { color: '#78716C', marginTop: 12 },
});
