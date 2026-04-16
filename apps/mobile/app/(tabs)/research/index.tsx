import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { trpc } from '@kb/api-client';

export default function ResearchHomeScreen() {
  const profile = trpc.profile.me.useQuery();

  if (profile.isPending) {
    return (
      <View style={styles.pad}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  if (!profile.data?.roles.includes('lawyer')) {
    return (
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={styles.warn}>Research is for lawyers only.</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <Text style={styles.title}>Research</Text>
      <Text style={styles.muted}>Judgments, law library, crosswalk, drafting.</Text>
      <Link href={'/(tabs)/research/judgments' as never} style={styles.card}>
        <Text style={styles.cardTitle}>Judgments</Text>
        <Text style={styles.cardMeta}>Search curated excerpts</Text>
      </Link>
      <Link href={'/(tabs)/research/library' as never} style={styles.card}>
        <Text style={styles.cardTitle}>Law library</Text>
        <Text style={styles.cardMeta}>Central Acts</Text>
      </Link>
      <Link href={'/(tabs)/research/mapper' as never} style={styles.card}>
        <Text style={styles.cardTitle}>IPC → BNS / BNSS</Text>
        <Text style={styles.cardMeta}>Illustrative mappings</Text>
      </Link>
      <Link href={'/(tabs)/research/drafting' as never} style={styles.card}>
        <Text style={styles.cardTitle}>AI drafting</Text>
        <Text style={styles.cardMeta}>Templates + facts</Text>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 20, paddingBottom: 40, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#1C1917' },
  muted: { fontSize: 14, color: '#57534E', marginBottom: 8 },
  warn: { color: '#92400e', backgroundColor: '#fffbeb', padding: 14, borderRadius: 12 },
  card: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1C1917' },
  cardMeta: { marginTop: 4, fontSize: 13, color: '#57534E' },
});
