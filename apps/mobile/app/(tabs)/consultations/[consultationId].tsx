import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { trpc } from '@kb/api-client';

export default function ConsultationDetailScreen() {
  const { consultationId } = useLocalSearchParams<{ consultationId: string }>();
  const id = consultationId ?? '';

  const q = trpc.consultations.byId.useQuery({ consultationId: id }, { enabled: Boolean(id), refetchInterval: 5000 });
  const list = trpc.consultations.chat.listMessages.useQuery(
    { consultationId: id, limit: 200 },
    { enabled: Boolean(id), refetchInterval: 2000 },
  );
  const send = trpc.consultations.chat.sendMessage.useMutation({
    onSuccess: async () => {
      setBody('');
      await list.refetch();
    },
  });

  const start = trpc.consultations.start.useMutation({ onSuccess: async () => q.refetch() });
  const end = trpc.consultations.end.useMutation({ onSuccess: async () => q.refetch() });

  const [body, setBody] = useState('');
  const messages = useMemo(() => list.data ?? [], [list.data]);

  return (
    <>
      <Stack.Screen options={{ title: 'Consultation' }} />
      <ScrollView contentContainerStyle={styles.container}>
        {q.isPending ? (
          <ActivityIndicator size="large" />
        ) : q.isError ? (
          <Text style={styles.error}>{q.error.message}</Text>
        ) : (
          <View style={styles.card}>
            <Text style={styles.title}>{q.data.consultation.mode.toUpperCase()} consultation</Text>
            <Text style={styles.meta}>Status: {q.data.consultation.status.replaceAll('_', ' ')}</Text>
            <Text style={styles.meta}>
              Scheduled: {q.data.consultation.scheduledAt ? new Date(q.data.consultation.scheduledAt).toLocaleString() : 'Not scheduled'}
            </Text>
            <Text style={styles.meta}>Payment: {q.data.payment?.status ?? 'none'}</Text>
            <Text style={styles.section}>Issue summary</Text>
            <Text style={styles.body}>{q.data.consultation.issueSummary}</Text>

            <View style={styles.actions}>
              <Pressable
                disabled={q.data.consultation.status !== 'scheduled' || start.isPending}
                onPress={() => start.mutate({ consultationId: id })}
                style={[styles.button, styles.secondary, q.data.consultation.status !== 'scheduled' ? styles.disabled : null]}
              >
                <Text style={styles.buttonTextSecondary}>Start</Text>
              </Pressable>
              <Pressable
                disabled={q.data.consultation.status !== 'in_progress' || end.isPending}
                onPress={() => end.mutate({ consultationId: id })}
                style={[styles.button, styles.primary, q.data.consultation.status !== 'in_progress' ? styles.disabled : null]}
              >
                <Text style={styles.buttonTextPrimary}>Complete</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.section}>Chat</Text>
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
            <TextInput value={body} onChangeText={setBody} placeholder="Type a message…" style={styles.input} />
            <Pressable
              disabled={!body.trim() || send.isPending}
              onPress={() => send.mutate({ consultationId: id, body: body.trim() })}
              style={[styles.button, styles.primary, !body.trim() ? styles.disabled : null]}
            >
              <Text style={styles.buttonTextPrimary}>Send</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Audio / video</Text>
          <Text style={styles.muted}>
            Calls are available when LiveKit is configured. Chat works in-app today.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 12 },
  card: { padding: 14, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7E5E4' },
  title: { fontSize: 18, fontWeight: '700', color: '#1C1917' },
  meta: { fontSize: 12, color: '#78716C', marginTop: 6 },
  section: { fontSize: 12, fontWeight: '700', color: '#78716C', marginTop: 12, textTransform: 'uppercase' },
  body: { fontSize: 14, color: '#292524', marginTop: 8, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  button: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: '#C2410C' },
  secondary: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7E5E4' },
  buttonTextPrimary: { color: '#FFFFFF', fontWeight: '700' },
  buttonTextSecondary: { color: '#44403C', fontWeight: '700' },
  disabled: { opacity: 0.6 },
  msgList: { gap: 8, marginTop: 10 },
  msg: { backgroundColor: '#FAFAF9', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#E7E5E4' },
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
});

