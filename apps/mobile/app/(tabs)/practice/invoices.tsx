import { Link, useGlobalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { trpc } from '@kb/api-client';

export default function PracticeInvoicesScreen() {
  const router = useRouter();
  const { caseId } = useGlobalSearchParams<{ caseId?: string }>();
  const cid = typeof caseId === 'string' ? caseId : undefined;
  const list = trpc.practice.billing.invoice.list.useQuery({ limit: 80 });
  const createDraft = trpc.practice.billing.invoice.createDraft.useMutation({
    onSuccess: (d) => {
      if (d.invoice?.id) router.push(`/(tabs)/practice/invoice/${d.invoice.id}` as never);
    },
  });
  const [busy, setBusy] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Link href={'/(tabs)/practice' as never} style={styles.back}>
        <Text style={styles.backText}>← Practice</Text>
      </Link>
      <Text style={styles.title}>Invoices</Text>
      {cid ? <Text style={styles.muted}>New invoices link to case {cid.slice(0, 8)}…</Text> : null}

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        <Link href={'/(tabs)/practice/billing-settings' as never} style={styles.btnSecondary}>
          <Text style={styles.btnSecondaryText}>GST & firm</Text>
        </Link>
        <Pressable
          style={styles.btn}
          disabled={busy || createDraft.isPending}
          onPress={() => {
            setBusy(true);
            void (async () => {
              try {
                await createDraft.mutateAsync({
                  caseId: cid,
                  issueDate: new Date(),
                  clientName: '',
                });
              } finally {
                setBusy(false);
              }
            })();
          }}
        >
          <Text style={styles.btnText}>New invoice</Text>
        </Pressable>
      </View>

      {list.isPending ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : list.isError ? (
        <Text style={styles.error}>{list.error.message}</Text>
      ) : (
        <View style={{ marginTop: 16, gap: 10 }}>
          {(list.data ?? []).map((inv) => (
            <Link key={inv.id} href={`/(tabs)/practice/invoice/${inv.id}` as never} style={styles.card}>
              <Text style={styles.cardTitle}>{inv.invoiceNumber}</Text>
              <Text style={styles.cardMeta}>
                {inv.status} · ₹{inv.totalInr}
              </Text>
            </Link>
          ))}
          {(list.data?.length ?? 0) === 0 ? <Text style={styles.muted}>No invoices yet.</Text> : null}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  back: { marginBottom: 8 },
  backText: { color: '#C2410C', fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '700', color: '#1C1917' },
  muted: { marginTop: 6, fontSize: 13, color: '#57534E' },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#C2410C',
    alignItems: 'center',
  },
  btnText: { fontWeight: '700', color: '#fff' },
  btnSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D6D3D1',
    alignItems: 'center',
  },
  btnSecondaryText: { fontWeight: '700', color: '#44403C' },
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    backgroundColor: '#fff',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#C2410C' },
  cardMeta: { marginTop: 4, fontSize: 13, color: '#57534E' },
  error: { color: '#b91c1c', marginTop: 12 },
});
