import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { trpc } from '@kb/api-client';

export default function LawyerDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const q = trpc.marketplace.lawyerBySlug.useQuery({ slug: slug ?? '' }, { enabled: Boolean(slug) });

  return (
    <>
      <Stack.Screen options={{ title: 'Lawyer' }} />
      <ScrollView contentContainerStyle={styles.container}>
        {q.isPending ? (
          <ActivityIndicator size="large" />
        ) : q.isError ? (
          <Text style={styles.error}>{q.error.message}</Text>
        ) : !q.data?.lawyer ? (
          <Text style={styles.muted}>Profile not found or not verified.</Text>
        ) : (
          <View>
            <Text style={styles.title}>{q.data.lawyer.displayName ?? 'Verified lawyer'}</Text>
            {q.data.lawyer.headline ? <Text style={styles.headline}>{q.data.lawyer.headline}</Text> : null}
            <Text style={styles.meta}>
              {[q.data.lawyer.city, q.data.lawyer.barState].filter(Boolean).join(' · ')}
            </Text>
            {q.data.lawyer.bio ? <Text style={styles.bio}>{q.data.lawyer.bio}</Text> : null}
            {q.data.lawyer.practiceAreas.length > 0 ? (
              <Text style={styles.tags}>Practice: {q.data.lawyer.practiceAreas.join(', ')}</Text>
            ) : null}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: '#1C1917' },
  headline: { fontSize: 16, color: '#44403C', marginTop: 8 },
  meta: { fontSize: 14, color: '#78716C', marginTop: 8 },
  bio: { fontSize: 15, color: '#292524', marginTop: 16, lineHeight: 22 },
  tags: { fontSize: 14, color: '#57534E', marginTop: 16 },
  error: { color: '#B91C1C' },
  muted: { color: '#78716C' },
});
