import { Stack, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const STATIC = [
  'about',
  'features',
  'pricing',
  'for-lawyers',
  'lawyer-connect',
  'document-review',
  'know-your-rights',
  'privacy-charter',
  'terms',
  'privacy',
  'waitlist',
  'waitlist-lawyer',
] as const;

const TAB_LINKS = [
  { title: 'Lawyers', href: '/marketing/lawyers' as const },
  { title: 'Legal Q&A', href: '/marketing/legal-qa' as const },
  { title: 'Ask Legal Q&A', href: '/marketing/legal-qa/ask' as const },
  { title: 'Notice Scanner', href: '/marketing/notice-scanner' as const },
  { title: 'Case Tracker', href: '/marketing/case-tracker' as const },
  { title: 'Kya Karein? (guide)', href: '/marketing/kya-karein' as const },
  { title: 'Rights', href: '/marketing/rights' as const },
] as const;

export default function MarketingHubScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Marketing hub' }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.intro}>
          Native mirror of pages that live under the web `[locale]/(marketing)` tree. Tabs stay the
          primary entry for product surfaces; deeper pages extend parity for SEO-equivalent
          journeys.
        </Text>

        <Text style={styles.section}>Informational</Text>
        <View style={styles.wrap}>
          {STATIC.map((slug) => (
            <TouchableOpacity
              key={slug}
              style={styles.chip}
              onPress={() => router.push(`/marketing/${slug}` as never)}
              accessibilityRole="button"
              accessibilityLabel={slug}
            >
              <Text style={styles.chipText}>{friendly(slug)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.section}>Product shortcuts (tabs)</Text>
        <View style={styles.wrap}>
          {TAB_LINKS.map((l) => (
            <TouchableOpacity
              key={l.href}
              style={styles.chipAlt}
              onPress={() => router.push(l.href)}
              accessibilityRole="button"
            >
              <Text style={styles.chipText}>{l.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.section}>Blog</Text>
        <TouchableOpacity style={styles.row} onPress={() => router.push('/marketing/blog')}>
          <Text style={styles.rowText}>Blog index</Text>
        </TouchableOpacity>

        <Text style={styles.section}>Vault shared link</Text>
        <Text style={styles.hint}>
          Open vault shared tokens from `/marketing/vault/shared/[token]` via deep navigation.
        </Text>

        <Text style={styles.section}>Notice scan result</Text>
        <Text style={styles.hint}>
          Use `/marketing/notice-scanner/result/[scanId]?t=` with the emailed access token.
        </Text>
      </ScrollView>
    </>
  );
}

function friendly(slug: string): string {
  return slug
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, paddingBottom: 44 },
  intro: { fontSize: 14, color: '#57534E', lineHeight: 21 },
  section: { marginTop: 10, fontSize: 13, fontWeight: '700', color: '#78350F' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  chipAlt: {
    borderWidth: 1,
    borderColor: '#FDBA74',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFF7ED',
  },
  chipText: { fontSize: 13, fontWeight: '600', color: '#1C1917' },
  row: { paddingVertical: 12 },
  rowText: { fontSize: 15, fontWeight: '700', color: '#C2410C' },
  hint: { fontSize: 12, color: '#78716C', lineHeight: 18 },
});
