import { Stack, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { BLOG_POSTS } from '@/lib/blog-posts.manifest';

export default function MarketingBlogIndex() {
  const router = useRouter();
  const posts = Object.values(BLOG_POSTS).sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <>
      <Stack.Screen options={{ title: 'Blog' }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.lead}>Product news and explainers — mirrored from web MDX index.</Text>
        {posts.map((p) => (
          <TouchableOpacity
            key={p.slug}
            style={styles.card}
            onPress={() => router.push(`/marketing/blog/${p.slug}` as never)}
            accessibilityRole="button"
          >
            <Text style={styles.date}>{p.date}</Text>
            <Text style={styles.title}>{p.title}</Text>
            <Text style={styles.desc}>{p.description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, paddingBottom: 36 },
  lead: { fontSize: 14, color: '#57534E', marginBottom: 6 },
  card: {
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#fff',
  },
  date: { fontSize: 11, fontWeight: '700', color: '#78716C' },
  title: { fontSize: 17, fontWeight: '800', color: '#1C1917', marginTop: 6 },
  desc: { fontSize: 13, color: '#57534E', marginTop: 6, lineHeight: 19 },
});
