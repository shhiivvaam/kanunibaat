import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { trpc } from '@jurisly/api-client';

type HomeShortcut = { title: string; subtitle: string; href: '/lawyers' | '/consultations' | '/notice-scanner' | '/guide' | '/vault' };

const SHORTCUTS: HomeShortcut[] = [
  {
    title: 'Lawyers',
    subtitle: 'Verified advocates & bookings',
    href: '/lawyers',
  },
  {
    title: 'Consultations',
    subtitle: 'Your sessions',
    href: '/consultations',
  },
  {
    title: 'Notice scanner',
    subtitle: 'Upload & understand notices',
    href: '/notice-scanner',
  },
  {
    title: 'Kya karein?',
    subtitle: 'Emergency & situation guide',
    href: '/guide',
  },
  {
    title: 'Vault',
    subtitle: 'Encrypted documents',
    href: '/vault',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const health = trpc.health.useQuery(undefined, {
    retry: 1,
    staleTime: 60_000,
  });

  const apiHint = health.isPending
    ? 'Checking API…'
    : health.isError
      ? `API unreachable (${health.error.message})`
      : health.data?.ok
        ? `API ${health.data.service} OK`
        : 'API unexpected response';

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Jurisly</Text>
      <Text style={styles.tagline}>Legal help in plain language — India.</Text>
      <Text style={styles.apiMeta}>{apiHint}</Text>

      <Text style={styles.sectionLabel}>Shortcuts</Text>
      <View style={styles.grid}>
        {SHORTCUTS.map((s) => (
          <Pressable
            key={s.href}
            style={styles.card}
            onPress={() => router.push(s.href)}
            accessibilityRole="button"
            accessibilityLabel={s.title}
          >
            <Text style={styles.cardTitle}>{s.title}</Text>
            <Text style={styles.cardSub}>{s.subtitle}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.footerHint}>
        Use Settings for notifications, onboarding, integrations, and admin — all native now. Explore
        web-equivalent marketing pages under Marketing hub.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 12, paddingBottom: 28 },
  title: { fontSize: 26, fontWeight: '800', color: '#1C1917' },
  tagline: { fontSize: 15, color: '#57534E' },
  apiMeta: { fontSize: 12, color: '#78716C' },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#44403C', marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: '48%',
    flexGrow: 1,
    minWidth: 140,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    backgroundColor: '#fff',
    gap: 4,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1C1917' },
  cardSub: { fontSize: 12, color: '#78716C' },
  footerHint: { fontSize: 12, color: '#A8A29E', marginTop: 12, lineHeight: 18 },
});
