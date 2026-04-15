import * as WebBrowser from 'expo-web-browser';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { trpc } from '@kb/api-client';

export default function LawyerDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const q = trpc.marketplace.lawyerBySlug.useQuery({ slug: slug ?? '' }, { enabled: Boolean(slug) });
  const lawyer = q.data?.lawyer ?? null;

  return (
    <>
      <Stack.Screen options={{ title: 'Lawyer' }} />
      <ScrollView contentContainerStyle={styles.container}>
        {q.isPending ? (
          <ActivityIndicator size="large" />
        ) : q.isError ? (
          <Text style={styles.error}>{q.error.message}</Text>
        ) : !lawyer ? (
          <Text style={styles.muted}>Profile not found or not verified.</Text>
        ) : (
          <View>
            <Text style={styles.title}>{lawyer.displayName ?? 'Verified lawyer'}</Text>
            {lawyer.headline ? <Text style={styles.headline}>{lawyer.headline}</Text> : null}
            <Text style={styles.meta}>
              {[lawyer.city, lawyer.barState].filter(Boolean).join(' · ')}
            </Text>
            <Pressable
              onPress={() =>
                WebBrowser.openBrowserAsync(
                  `http://localhost:3000/app/consultations/book?lawyerUserId=${encodeURIComponent(
                    lawyer.userId,
                  )}&slug=${encodeURIComponent(lawyer.slug)}`,
                )
              }
              style={styles.bookButton}
            >
              <Text style={styles.bookButtonText}>Book consultation (web)</Text>
            </Pressable>
            {lawyer.bio ? <Text style={styles.bio}>{lawyer.bio}</Text> : null}
            {lawyer.practiceAreas.length > 0 ? (
              <Text style={styles.tags}>Practice: {lawyer.practiceAreas.join(', ')}</Text>
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
  bookButton: {
    marginTop: 14,
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#C2410C',
  },
  bookButtonText: { color: '#FFFFFF', fontWeight: '700' },
  error: { color: '#B91C1C' },
  muted: { color: '#78716C' },
});
