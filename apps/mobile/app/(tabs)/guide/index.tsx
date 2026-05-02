import type { Href } from 'expo-router';
import { Link, Stack } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { trpc } from '@jurisly/api-client';

export default function GuideListScreen() {
  const list = trpc.emergencyGuide.list.useQuery();
  const [q, setQ] = useState('');
  const rows = useMemo(() => {
    const all = list.data?.scenarios ?? [];
    const needle = q.trim().toLowerCase();
    if (!needle) return all;
    return all.filter(
      (s) =>
        s.titleEn.toLowerCase().includes(needle) ||
        s.titleHi.includes(q.trim()) ||
        s.slug.includes(needle),
    );
  }, [list.data?.scenarios, q]);

  return (
    <>
      <Stack.Screen options={{ title: 'Kya Karein?' }} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hotlines}>
          <Text style={styles.hotlinesTitle}>Emergency (India)</Text>
          <Text style={styles.hotlinesText}>Police 100 · Women 1091 · Legal Aid 15100</Text>
        </View>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Describe your situation…"
          style={styles.search}
        />
        {list.isPending ? (
          <ActivityIndicator size="large" />
        ) : list.isError ? (
          <Text style={styles.error}>{list.error.message}</Text>
        ) : (
          <View style={styles.list}>
            {rows.map((s) => (
              <Link key={s.slug} href={`/(tabs)/guide/${s.slug}` as Href} style={styles.card}>
                <Text style={styles.cardTitle}>{s.titleEn}</Text>
                <Text style={styles.cardHi}>{s.titleHi}</Text>
                <Text style={styles.badge}>{s.urgency}</Text>
              </Link>
            ))}
          </View>
        )}
        {list.data?.disclaimer ? (
          <Text style={styles.disclaimer}>{list.data.disclaimer}</Text>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 12 },
  hotlines: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  hotlinesTitle: { fontWeight: '700', color: '#1C1917', marginBottom: 4 },
  hotlinesText: { fontSize: 13, color: '#44403C' },
  search: {
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#FFFFFF',
  },
  list: { gap: 10 },
  card: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1C1917' },
  cardHi: { fontSize: 14, color: '#57534E', marginTop: 4 },
  badge: { fontSize: 11, color: '#78716C', marginTop: 8, textTransform: 'capitalize' },
  error: { color: '#B91C1C' },
  disclaimer: { fontSize: 11, color: '#A8A29E', marginTop: 8 },
});
