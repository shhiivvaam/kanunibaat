import { Link } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { trpc } from '@jurisly/api-client';

export default function ResearchDraftingScreen() {
  const fill = trpc.research.drafting.fillTemplate.useMutation();
  const [templateKey] = useState<
    'legal_notice_reply' | 'bail_application_outline' | 'written_statement_outline'
  >('legal_notice_reply');
  const [factsRaw, setFactsRaw] = useState('{"clientName":"[Name]"}');

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <Link href={'/(tabs)/research' as never}>
        <Text style={styles.back}>← Research</Text>
      </Link>
      <Text style={styles.title}>AI drafting</Text>
      <Text style={styles.hint}>JSON object → string values. Requires API OpenAI key.</Text>
      <TextInput style={styles.input} value={factsRaw} onChangeText={setFactsRaw} multiline />
      <Pressable
        style={styles.btn}
        disabled={fill.isPending}
        onPress={() => {
          try {
            const facts = JSON.parse(factsRaw) as Record<string, string>;
            void fill.mutateAsync({ templateKey, facts });
          } catch {
            // ignore
          }
        }}
      >
        {fill.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Generate</Text>
        )}
      </Pressable>
      {fill.error ? <Text style={styles.err}>{fill.error.message}</Text> : null}
      {fill.data ? (
        <View style={styles.out}>
          <Text style={styles.outTitle}>{fill.data.draft.title}</Text>
          <Text style={styles.outBody}>{fill.data.draft.body}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 20, gap: 12 },
  back: { color: '#C2410C', fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700', color: '#1C1917' },
  hint: { fontSize: 12, color: '#78716C' },
  input: {
    borderWidth: 1,
    borderColor: '#D6D3D1',
    borderRadius: 10,
    padding: 10,
    minHeight: 100,
    fontFamily: 'monospace',
    fontSize: 12,
  },
  btn: { backgroundColor: '#C2410C', padding: 12, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  err: { color: '#b91c1c' },
  out: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  outTitle: { fontWeight: '700', fontSize: 16, color: '#1C1917' },
  outBody: { marginTop: 8, fontSize: 14, color: '#44403C' },
});
