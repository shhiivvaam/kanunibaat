import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { MarketingStaticScreen } from '@/components/marketing-static-screen';
import { BLOG_POSTS } from '@/lib/blog-posts.manifest';

export default function MarketingBlogPostScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const post = typeof slug === 'string' ? BLOG_POSTS[slug] : undefined;

  if (!post) {
    return (
      <View style={styles.fail}>
        <Stack.Screen options={{ title: 'Not found' }} />
        <Text style={styles.err}>Unknown blog slug.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: post.title }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ paddingHorizontal: 18, paddingTop: 8 }}>
          <Text style={styles.meta}>
            {post.date}
            {post.author ? ` · ${post.author}` : ''}
          </Text>
        </View>
        <MarketingStaticScreen title={post.title} paragraphs={[post.description, post.body]} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  fail: { flex: 1, padding: 20 },
  err: { color: '#B91C1C' },
  meta: { fontSize: 12, color: '#78716C', fontWeight: '600' },
});
