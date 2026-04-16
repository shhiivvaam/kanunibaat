import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { trpc } from '@kb/api-client';

export default function LegalQaDetailScreen() {
  const params = useLocalSearchParams();
  const questionId = typeof params.questionId === 'string' ? params.questionId : '';

  const q = trpc.qa.question.byId.useQuery({ id: questionId }, { enabled: Boolean(questionId) });
  const me = trpc.profile.me.useQuery(undefined, { staleTime: 60_000 });
  const canAnswer = (me.data?.roles.includes('lawyer') ?? false) && me.data?.lawyer?.verificationStatus === 'verified';

  const utils = trpc.useUtils();
  const vote = trpc.qa.vote.set.useMutation({
    onSuccess: async () => {
      await utils.qa.question.byId.invalidate({ id: questionId });
      await utils.qa.question.list.invalidate();
    },
  });
  const ai = trpc.qa.question.aiPreview.useMutation({
    onSuccess: async () => {
      await utils.qa.question.byId.invalidate({ id: questionId });
    },
  });
  const answer = trpc.qa.answer.create.useMutation({
    onSuccess: async () => {
      setAnswerBody('');
      await utils.qa.question.byId.invalidate({ id: questionId });
      await utils.qa.question.list.invalidate();
    },
  });

  const [answerBody, setAnswerBody] = useState('');

  const row = q.data?.question;
  const answers = q.data?.answers ?? [];
  const votes = q.data?.votes ?? { up: 0, down: 0 };
  const aiPreview = row?.aiPreviewJson as null | { summary?: string; steps?: string[]; disclaimer?: string };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {q.isLoading ? <Text style={styles.sub}>Loading…</Text> : null}
      {q.isError ? <Text style={styles.err}>{q.error.message}</Text> : null}

      {row ? (
        <View style={styles.card}>
          <Text style={styles.title}>{row.title}</Text>
          <Text style={styles.meta}>{row.category || 'general'}</Text>
          <Text style={styles.body}>{row.body}</Text>

          <View style={styles.row}>
            <Pressable style={styles.pill} onPress={() => void vote.mutateAsync({ questionId: row.id, value: 'up' })}>
              <Text>Up ({votes.up})</Text>
            </Pressable>
            <Pressable style={styles.pill} onPress={() => void vote.mutateAsync({ questionId: row.id, value: 'down' })}>
              <Text>Down ({votes.down})</Text>
            </Pressable>
            <Pressable style={styles.pill} onPress={() => void vote.mutateAsync({ questionId: row.id, value: null })}>
              <Text>Clear</Text>
            </Pressable>
            <View style={{ flex: 1 }} />
            <Pressable style={styles.primaryBtn} onPress={() => void ai.mutateAsync({ id: row.id, locale: 'en' })}>
              <Text style={styles.primaryBtnText}>AI preview</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {aiPreview ? (
        <View style={[styles.card, { borderColor: '#fed7aa', backgroundColor: '#fff7ed' }]}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#9a3412' }}>AI preview (general)</Text>
          {aiPreview.summary ? <Text style={[styles.body, { marginTop: 6 }]}>{aiPreview.summary}</Text> : null}
          {Array.isArray(aiPreview.steps) ? (
            <View style={{ marginTop: 6, gap: 4 }}>
              {aiPreview.steps.map((s, idx) => (
                <Text key={idx} style={styles.body}>
                  - {s}
                </Text>
              ))}
            </View>
          ) : null}
          {aiPreview.disclaimer ? <Text style={[styles.meta, { marginTop: 8, color: '#7c2d12' }]}>{aiPreview.disclaimer}</Text> : null}
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={{ fontSize: 14, fontWeight: '700' }}>Answers</Text>
        {answers.length === 0 ? <Text style={styles.sub}>No answers yet.</Text> : null}
        <View style={{ gap: 10, marginTop: 8 }}>
          {answers.map((a) => (
            <View key={a.id} style={[styles.card, { padding: 10 }]}>
              <Text style={styles.body}>{a.body}</Text>
            </View>
          ))}
        </View>
      </View>

      {canAnswer ? (
        <View style={styles.card}>
          <Text style={{ fontSize: 14, fontWeight: '700' }}>Post an answer</Text>
          <TextInput style={[styles.input, styles.textarea]} multiline value={answerBody} onChangeText={setAnswerBody} />
          <Pressable
            style={[styles.greenBtn, answer.isPending || answerBody.trim().length < 20 ? { opacity: 0.6 } : null]}
            disabled={answer.isPending || answerBody.trim().length < 20}
            onPress={() => void answer.mutateAsync({ questionId, body: answerBody.trim() })}
          >
            <Text style={styles.primaryBtnText}>Submit</Text>
          </Pressable>
          {answer.error ? <Text style={styles.err}>{answer.error.message}</Text> : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 12, backgroundColor: '#fff', gap: 6 },
  title: { fontSize: 18, fontWeight: '700' },
  meta: { fontSize: 12, color: '#666' },
  sub: { fontSize: 13, color: '#444' },
  body: { fontSize: 13, color: '#111', lineHeight: 18 },
  err: { fontSize: 13, color: '#b91c1c' },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 },
  pill: { borderWidth: 1, borderColor: '#eee', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  primaryBtn: { backgroundColor: '#C2410C', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 10 },
  textarea: { minHeight: 120, textAlignVertical: 'top' },
  greenBtn: { backgroundColor: '#15803d', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 6 },
});

