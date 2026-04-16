import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { trpc } from '@kb/api-client';

const STATUSES = [
  'intake',
  'active',
  'hearing_scheduled',
  'pending_docs',
  'judgement',
  'closed',
  'appealed',
] as const;

const COURT_TYPES = ['district', 'high_court', 'supreme_court', 'tribunal', 'other'] as const;

export default function PracticeNewCaseScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const clients = trpc.cases.client.list.useQuery();
  const create = trpc.cases.case.create.useMutation({
    onSuccess: async (data) => {
      await utils.cases.case.list.invalidate();
      if (data.case?.id) {
        router.replace(`/(tabs)/practice/${data.case.id}` as never);
      }
    },
  });

  const [lawyerClientId, setLawyerClientId] = useState<string | null>(null);
  const [clientDisplayName, setClientDisplayName] = useState('');
  const [courtName, setCourtName] = useState('');
  const [courtTypeIdx, setCourtTypeIdx] = useState(4);
  const [caseType, setCaseType] = useState('');
  const [cnrNumber, setCnrNumber] = useState('');
  const [statusIdx, setStatusIdx] = useState(0);
  const [description, setDescription] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Link href={'/(tabs)/practice/cases' as never} style={styles.back}>
        <Text style={styles.backText}>Cancel</Text>
      </Link>
      <Text style={styles.title}>New case</Text>

      <Text style={styles.label}>Linked client (optional)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
        <Pressable
          style={[styles.chip, lawyerClientId === null && styles.chipOn]}
          onPress={() => setLawyerClientId(null)}
        >
          <Text style={[styles.chipText, lawyerClientId === null && styles.chipTextOn]}>None</Text>
        </Pressable>
        {(clients.data?.clients ?? []).map((c) => (
          <Pressable
            key={c.id}
            style={[styles.chip, lawyerClientId === c.id && styles.chipOn]}
            onPress={() => setLawyerClientId(c.id)}
          >
            <Text style={[styles.chipText, lawyerClientId === c.id && styles.chipTextOn]}>{c.displayName}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={[styles.label, { marginTop: 12 }]}>Offline client name</Text>
      <TextInput style={styles.input} value={clientDisplayName} onChangeText={setClientDisplayName} />

      <Text style={[styles.label, { marginTop: 12 }]}>Court / title</Text>
      <TextInput style={styles.input} value={courtName} onChangeText={setCourtName} />

      <Text style={[styles.label, { marginTop: 12 }]}>Court type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
        {COURT_TYPES.map((t, i) => (
          <Pressable key={t} style={[styles.chip, courtTypeIdx === i && styles.chipOn]} onPress={() => setCourtTypeIdx(i)}>
            <Text style={[styles.chipText, courtTypeIdx === i && styles.chipTextOn]}>{t}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={[styles.label, { marginTop: 12 }]}>Case type</Text>
      <TextInput style={styles.input} value={caseType} onChangeText={setCaseType} />

      <Text style={[styles.label, { marginTop: 12 }]}>CNR</Text>
      <TextInput style={styles.input} value={cnrNumber} onChangeText={setCnrNumber} />

      <Text style={[styles.label, { marginTop: 12 }]}>Status</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
        {STATUSES.map((s, i) => (
          <Pressable key={s} style={[styles.chip, statusIdx === i && styles.chipOn]} onPress={() => setStatusIdx(i)}>
            <Text style={[styles.chipText, statusIdx === i && styles.chipTextOn]}>{s}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={[styles.label, { marginTop: 12 }]}>Description</Text>
      <TextInput style={[styles.input, { minHeight: 80 }]} value={description} onChangeText={setDescription} multiline />

      {create.error ? <Text style={styles.error}>{create.error.message}</Text> : null}

      <Pressable
        style={[styles.btn, create.isPending && styles.btnDisabled]}
        disabled={create.isPending}
        onPress={() =>
          void create.mutateAsync({
            lawyerClientId,
            clientDisplayName: clientDisplayName.trim() || null,
            courtName: courtName.trim() || undefined,
            courtType: COURT_TYPES[courtTypeIdx],
            caseType: caseType.trim(),
            cnrNumber: cnrNumber.trim() || null,
            status: STATUSES[statusIdx],
            description: description.trim(),
          })
        }
      >
        <Text style={styles.btnText}>Create case</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  back: { marginBottom: 12 },
  backText: { color: '#C2410C', fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '700', color: '#1C1917', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#44403C' },
  input: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#D6D3D1',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    color: '#1C1917',
  },
  chipsScroll: { marginTop: 8, maxHeight: 44 },
  chip: {
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D6D3D1',
  },
  chipOn: { backgroundColor: '#1C1917', borderColor: '#1C1917' },
  chipText: { fontSize: 12, color: '#44403C' },
  chipTextOn: { color: '#fff' },
  btn: {
    marginTop: 20,
    backgroundColor: '#C2410C',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  error: { color: '#b91c1c', marginTop: 12 },
});
