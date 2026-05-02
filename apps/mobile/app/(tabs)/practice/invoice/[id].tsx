import { Link, useLocalSearchParams } from 'expo-router';
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

export default function PracticeInvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const invoiceId = typeof id === 'string' ? id : '';
  const utils = trpc.useUtils();

  const q = trpc.practice.billing.invoice.byId.useQuery(
    { id: invoiceId },
    { enabled: Boolean(invoiceId) },
  );
  const inv = q.data?.invoice;
  const lines = q.data?.lines ?? [];

  const [lineDesc, setLineDesc] = useState('');
  const [lineRate, setLineRate] = useState('2000');

  const addLine = trpc.practice.billing.invoice.addLine.useMutation({
    onSuccess: async () => {
      await utils.practice.billing.invoice.byId.invalidate({ id: invoiceId });
      setLineDesc('');
    },
  });
  const finalize = trpc.practice.billing.invoice.finalize.useMutation({
    onSuccess: async () => {
      await utils.practice.billing.invoice.byId.invalidate({ id: invoiceId });
      await utils.practice.billing.invoice.list.invalidate();
    },
  });

  if (!invoiceId) return <Text style={styles.error}>Invalid invoice</Text>;
  if (q.isPending)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  if (q.isError) return <Text style={styles.error}>{q.error.message}</Text>;
  if (!inv) return null;

  const draft = inv.status === 'draft';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Link href={'/(tabs)/practice/invoices' as never} style={styles.back}>
        <Text style={styles.backText}>← Invoices</Text>
      </Link>
      <Text style={styles.title}>{inv.invoiceNumber}</Text>
      <Text style={styles.muted}>
        {inv.status} · Total ₹{inv.totalInr}
      </Text>

      {lines.map((l) => (
        <Text key={l.id} style={styles.row}>
          {l.description} · ₹{l.taxableInr}
        </Text>
      ))}

      {draft ? (
        <>
          <Text style={[styles.section, { marginTop: 16 }]}>Add line</Text>
          <TextInput
            style={styles.input}
            value={lineDesc}
            onChangeText={setLineDesc}
            placeholder="Description"
          />
          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            value={lineRate}
            onChangeText={setLineRate}
            keyboardType="number-pad"
            placeholder="Rate INR"
          />
          <Pressable
            style={[styles.btn, { marginTop: 10 }]}
            disabled={addLine.isPending}
            onPress={() =>
              void addLine.mutateAsync({
                invoiceId,
                description: lineDesc.trim() || 'Line',
                quantity: 1,
                unitRateInr: Math.max(0, Math.floor(Number(lineRate) || 0)),
              })
            }
          >
            <Text style={styles.btnText}>Add line</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, { marginTop: 10, backgroundColor: '#15803d' }]}
            disabled={finalize.isPending || lines.length === 0}
            onPress={() => void finalize.mutateAsync({ id: invoiceId })}
          >
            <Text style={styles.btnText}>Finalize</Text>
          </Pressable>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 20, paddingBottom: 40 },
  back: { marginBottom: 8 },
  backText: { color: '#C2410C', fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700', color: '#1C1917' },
  muted: { marginTop: 6, fontSize: 13, color: '#57534E' },
  section: { fontSize: 15, fontWeight: '700', color: '#1C1917' },
  input: { borderWidth: 1, borderColor: '#D6D3D1', borderRadius: 10, padding: 10, fontSize: 15 },
  btn: { paddingVertical: 12, borderRadius: 12, backgroundColor: '#C2410C', alignItems: 'center' },
  btnText: { fontWeight: '700', color: '#fff' },
  row: { marginTop: 8, fontSize: 13, color: '#44403C' },
  error: { padding: 20, color: '#b91c1c' },
});
