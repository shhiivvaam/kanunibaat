import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { trpc } from '@kb/api-client';

export default function AskQuestionScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);

  const create = trpc.qa.question.create.useMutation();

  async function onSubmit() {
    const r = await create.mutateAsync({
      title: title.trim(),
      body: body.trim(),
      category: category.trim(),
      isAnonymous,
    });
    if (r.question?.id) router.replace(`/legal-qa/${r.question.id}` as any);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Ask a question</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Title</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} />
        <Text style={styles.label}>Details</Text>
        <TextInput style={[styles.input, styles.textarea]} multiline value={body} onChangeText={setBody} />
        <Text style={styles.label}>Category (optional)</Text>
        <TextInput style={styles.input} value={category} onChangeText={setCategory} />

        <Pressable style={styles.checkboxRow} onPress={() => setIsAnonymous((x) => !x)}>
          <View style={[styles.checkbox, isAnonymous ? styles.checkboxChecked : null]} />
          <Text style={styles.checkboxText}>Post anonymously</Text>
        </Pressable>

        <Pressable
          style={[styles.primaryBtn, create.isPending || title.trim().length < 10 || body.trim().length < 20 ? styles.primaryBtnDisabled : null]}
          disabled={create.isPending || title.trim().length < 10 || body.trim().length < 20}
          onPress={() => void onSubmit()}
        >
          <Text style={styles.primaryBtnText}>Post</Text>
        </Pressable>
        {create.error ? <Text style={styles.err}>{create.error.message}</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  title: { fontSize: 20, fontWeight: '700' },
  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 12, backgroundColor: '#fff', gap: 8 },
  label: { fontSize: 12, color: '#444' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 10 },
  textarea: { minHeight: 120, textAlignVertical: 'top' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  checkbox: { width: 18, height: 18, borderWidth: 1, borderColor: '#bbb', borderRadius: 4 },
  checkboxChecked: { backgroundColor: '#C2410C', borderColor: '#C2410C' },
  checkboxText: { fontSize: 13, color: '#444' },
  primaryBtn: { backgroundColor: '#C2410C', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  err: { fontSize: 13, color: '#b91c1c' },
});

