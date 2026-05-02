import * as WebBrowser from 'expo-web-browser';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { trpc } from '@jurisly/api-client';

export default function LawyerDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const q = trpc.marketplace.lawyerBySlug.useQuery(
    { slug: slug ?? '' },
    { enabled: Boolean(slug) },
  );
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
            {lawyer.avgRating != null && lawyer.reviewCount > 0 ? (
              <Text style={styles.meta}>
                Rating: {lawyer.avgRating.toFixed(1)} / 5 ({lawyer.reviewCount} verified)
              </Text>
            ) : null}
            {lawyer.avgFirstReplyMinutes != null ? (
              <Text style={styles.meta}>
                Typical first reply: ~{lawyer.avgFirstReplyMinutes} min
              </Text>
            ) : null}
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
            {lawyer.recentReviews?.length ? (
              <View style={{ marginTop: 16 }}>
                <Text style={[styles.section, { marginTop: 0 }]}>Recent reviews</Text>
                {lawyer.recentReviews.map((r, idx) => (
                  <View
                    key={`rev-${idx}`}
                    style={{
                      marginTop: 10,
                      padding: 10,
                      borderRadius: 12,
                      backgroundColor: '#FAFAF9',
                    }}
                  >
                    <Text style={{ fontWeight: '700', color: '#1C1917' }}>{r.rating} / 5</Text>
                    {r.reviewText ? <Text style={styles.tags}>{r.reviewText}</Text> : null}
                    <Text style={styles.timestamp}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
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
  section: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78716C',
    textTransform: 'uppercase',
  },
  timestamp: { fontSize: 11, color: '#A8A29E', marginTop: 8 },
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
