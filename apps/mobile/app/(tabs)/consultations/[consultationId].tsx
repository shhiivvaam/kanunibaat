import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { trpc } from '@jurisly/api-client';

import { getSessionToken } from '@/lib/auth-token';
import { trpcPlatformApiBase } from '@/lib/trpc-url';

export default function ConsultationDetailScreen() {
  const { consultationId } = useLocalSearchParams<{ consultationId: string }>();
  const id = consultationId ?? '';

  const [streamingOk, setStreamingOk] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const q = trpc.consultations.byId.useQuery(
    { consultationId: id },
    { enabled: Boolean(id), refetchInterval: 5000 },
  );
  const list = trpc.consultations.chat.listMessages.useQuery(
    { consultationId: id, limit: 200 },
    {
      enabled: Boolean(id),
      refetchInterval: streamingOk ? false : 2500,
    },
  );
  const send = trpc.consultations.chat.sendMessage.useMutation({
    onSuccess: async () => {
      setBody('');
      await list.refetch();
    },
  });

  const start = trpc.consultations.start.useMutation({ onSuccess: async () => q.refetch() });
  const end = trpc.consultations.end.useMutation({ onSuccess: async () => q.refetch() });
  const liveKitToken = trpc.consultations.liveKit.getToken.useMutation();
  const submitReview = trpc.consultations.submitVerifiedReview.useMutation({
    onSuccess: async () => q.refetch(),
  });

  const [body, setBody] = useState('');
  const messages = useMemo(() => list.data ?? [], [list.data]);

  const bumpList = useCallback(() => {
    void list.refetch();
  }, [list]);

  useEffect(() => {
    if (!id) return;
    let es: EventSource | null = null;
    let cancelled = false;

    void (async () => {
      const token = await getSessionToken();
      if (cancelled || !token || typeof EventSource === 'undefined') {
        setStreamingOk(false);
        return;
      }
      const base = trpcPlatformApiBase();
      const url = `${base}/sse/consultations/${encodeURIComponent(id)}/messages?access_token=${encodeURIComponent(token)}`;
      try {
        es = new EventSource(url);
        es.addEventListener('ready', () => setStreamingOk(true));
        es.addEventListener('refresh', () => bumpList());
        es.onerror = () => setStreamingOk(false);
      } catch {
        setStreamingOk(false);
      }
    })();

    return () => {
      cancelled = true;
      es?.close();
      setStreamingOk(false);
    };
  }, [id, bumpList]);

  const data = q.data;

  return (
    <>
      <Stack.Screen options={{ title: 'Consultation' }} />
      <ScrollView contentContainerStyle={styles.container}>
        {q.isPending ? (
          <ActivityIndicator size="large" />
        ) : q.isError ? (
          <Text style={styles.error}>{q.error.message}</Text>
        ) : data ? (
          <View style={styles.card}>
            <Text style={styles.title}>{data.consultation.mode.toUpperCase()} consultation</Text>
            <Text style={styles.meta}>Status: {data.consultation.status.replaceAll('_', ' ')}</Text>
            <Text style={styles.meta}>
              Scheduled:{' '}
              {data.consultation.scheduledAt
                ? new Date(data.consultation.scheduledAt).toLocaleString()
                : 'Not scheduled'}
            </Text>
            <Text style={styles.meta}>Payment: {data.payment?.status ?? 'none'}</Text>
            <Text style={styles.section}>Issue summary</Text>
            <Text style={styles.body}>{data.consultation.issueSummary}</Text>

            <View style={styles.actions}>
              <Pressable
                disabled={data.consultation.status !== 'scheduled' || start.isPending}
                onPress={() => start.mutate({ consultationId: id })}
                style={[
                  styles.button,
                  styles.secondary,
                  data.consultation.status !== 'scheduled' ? styles.disabled : null,
                ]}
              >
                <Text style={styles.buttonTextSecondary}>Start</Text>
              </Pressable>
              <Pressable
                disabled={data.consultation.status !== 'in_progress' || end.isPending}
                onPress={() => end.mutate({ consultationId: id })}
                style={[
                  styles.button,
                  styles.primary,
                  data.consultation.status !== 'in_progress' ? styles.disabled : null,
                ]}
              >
                <Text style={styles.buttonTextPrimary}>Complete</Text>
              </Pressable>
            </View>

            {(data.consultation.mode === 'audio' || data.consultation.mode === 'video') &&
            (data.consultation.status === 'scheduled' ||
              data.consultation.status === 'in_progress') ? (
              <View style={{ marginTop: 16 }}>
                <Text style={styles.section}>Live session (LiveKit)</Text>
                <Text style={styles.muted}>
                  Copy a join payload for a LiveKit client. Requires LiveKit env on the API.
                </Text>
                <Pressable
                  disabled={liveKitToken.isPending}
                  onPress={async () => {
                    const r = await liveKitToken.mutateAsync({ consultationId: id });
                    await Share.share({ message: JSON.stringify(r, null, 2) });
                  }}
                  style={[
                    styles.button,
                    styles.primary,
                    { marginTop: 10, alignSelf: 'flex-start' },
                  ]}
                >
                  <Text style={styles.buttonTextPrimary}>
                    {liveKitToken.isPending ? '…' : 'Share join payload'}
                  </Text>
                </Pressable>
                {liveKitToken.isError ? (
                  <Text style={styles.error}>{liveKitToken.error.message}</Text>
                ) : null}
              </View>
            ) : null}

            {data.consultation.status === 'completed' && !data.review ? (
              <View style={{ marginTop: 16 }}>
                <Text style={styles.section}>Rate this consultation</Text>
                <Text style={styles.muted}>Stars 1–5 (one review per booking)</Text>
                <TextInput
                  keyboardType="number-pad"
                  value={String(reviewRating)}
                  onChangeText={(t) =>
                    setReviewRating(
                      Math.min(5, Math.max(1, Number.parseInt(t.replace(/\D/g, ''), 10) || 1)),
                    )
                  }
                  style={styles.ratingInput}
                />
                <TextInput
                  value={reviewText}
                  onChangeText={setReviewText}
                  placeholder="Optional comment"
                  style={[styles.input, { marginTop: 10, minHeight: 80 }]}
                  multiline
                  maxLength={2000}
                />
                <Pressable
                  disabled={submitReview.isPending}
                  style={[styles.button, styles.primary, { marginTop: 12 }]}
                  onPress={() =>
                    submitReview.mutate({
                      consultationId: id,
                      rating: reviewRating,
                      reviewText: reviewText.trim() || undefined,
                    })
                  }
                >
                  <Text style={styles.buttonTextPrimary}>Submit review</Text>
                </Pressable>
                {submitReview.isError ? (
                  <Text style={styles.error}>{submitReview.error.message}</Text>
                ) : null}
              </View>
            ) : null}

            {data.review ? (
              <View
                style={{ marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: '#FFF7ED' }}
              >
                <Text style={styles.section}>Your review</Text>
                <Text style={styles.body}>{data.review.rating} / 5</Text>
                {data.review.reviewText ? (
                  <Text style={styles.body}>{data.review.reviewText}</Text>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.section}>Chat {streamingOk ? '(live)' : ''}</Text>
          {list.isPending ? (
            <ActivityIndicator />
          ) : list.isError ? (
            <Text style={styles.error}>{list.error.message}</Text>
          ) : messages.length === 0 ? (
            <Text style={styles.muted}>No messages yet.</Text>
          ) : (
            <View style={styles.msgList}>
              {messages.map((m) => (
                <View key={m.id} style={styles.msg}>
                  <Text style={styles.msgBody}>{m.body}</Text>
                  <Text style={styles.msgMeta}>{new Date(m.createdAt).toLocaleString()}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.composer}>
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Type a message…"
              style={styles.input}
            />
            <Pressable
              disabled={!body.trim() || send.isPending}
              onPress={() => send.mutate({ consultationId: id, body: body.trim() })}
              style={[styles.button, styles.primary, !body.trim() ? styles.disabled : null]}
            >
              <Text style={styles.buttonTextPrimary}>Send</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 12 },
  card: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#1C1917' },
  meta: { fontSize: 12, color: '#78716C', marginTop: 6 },
  section: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78716C',
    marginTop: 12,
    textTransform: 'uppercase',
  },
  body: { fontSize: 14, color: '#292524', marginTop: 8, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: '#C2410C' },
  secondary: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7E5E4' },
  buttonTextPrimary: { color: '#FFFFFF', fontWeight: '700' },
  buttonTextSecondary: { color: '#44403C', fontWeight: '700' },
  disabled: { opacity: 0.6 },
  msgList: { gap: 8, marginTop: 10 },
  msg: {
    backgroundColor: '#FAFAF9',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  msgBody: { color: '#1C1917', fontSize: 14 },
  msgMeta: { color: '#A8A29E', fontSize: 11, marginTop: 4 },
  composer: { flexDirection: 'row', gap: 10, marginTop: 12, alignItems: 'center' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  error: { color: '#B91C1C' },
  muted: { color: '#78716C' },
  ratingInput: {
    marginTop: 8,
    maxWidth: 80,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
});
