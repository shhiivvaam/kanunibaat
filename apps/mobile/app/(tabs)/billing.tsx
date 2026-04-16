import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { trpc } from '@kb/api-client';

export default function BillingScreen() {
  const plans = trpc.billing.plans.list.useQuery();
  const sub = trpc.billing.subscription.me.useQuery();
  const ent = trpc.billing.entitlements.me.useQuery();
  const history = trpc.billing.billingHistory.list.useQuery({ limit: 20 });

  const utils = trpc.useUtils();
  const create = trpc.billing.subscription.createOrUpdate.useMutation({
    onSuccess: async () => {
      await utils.billing.subscription.me.invalidate();
      await utils.billing.entitlements.me.invalidate();
      await utils.billing.billingHistory.list.invalidate();
    },
  });
  const cancel = trpc.billing.subscription.cancel.useMutation({
    onSuccess: async () => {
      await utils.billing.subscription.me.invalidate();
      await utils.billing.entitlements.me.invalidate();
    },
  });

  const planRows = useMemo(() => plans.data?.plans ?? [], [plans.data?.plans]);
  const currentPlanKey = ent.data?.entitlements.planKey ?? 'free';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Billing</Text>
      <Text style={styles.sub}>Manage your subscription</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Current plan</Text>
        <Text style={styles.meta}>
          {currentPlanKey.toUpperCase()} · Notice scans remaining:{' '}
          {ent.data?.entitlements.usage.noticeScansRemaining ?? 'Unlimited'}
        </Text>
        {sub.data?.subscription?.razorpaySubscriptionId ? (
          <Text style={styles.meta}>
            Razorpay subscription: {sub.data.subscription.razorpaySubscriptionId}
          </Text>
        ) : null}
      </View>

      {plans.isLoading ? <Text style={styles.sub}>Loading plans…</Text> : null}
      {plans.isError ? <Text style={styles.err}>{plans.error.message}</Text> : null}
      {create.error ? <Text style={styles.err}>{create.error.message}</Text> : null}
      {cancel.error ? <Text style={styles.err}>{cancel.error.message}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Plans</Text>
        <View style={{ gap: 10, marginTop: 10 }}>
          {planRows
            .filter((p) => p.key !== 'free')
            .map((p) => (
              <View key={p.id} style={styles.innerCard}>
                <Text style={styles.cardTitle}>{p.name}</Text>
                <Text style={styles.meta}>₹{p.priceInr}/month</Text>
                <Pressable
                  style={[styles.primaryBtn, create.isPending ? { opacity: 0.6 } : null]}
                  disabled={create.isPending}
                  onPress={() => void create.mutateAsync({ planKey: p.key as any })}
                >
                  <Text style={styles.primaryBtnText}>Subscribe</Text>
                </Pressable>
              </View>
            ))}
        </View>

        {sub.data?.subscription?.razorpaySubscriptionId ? (
          <Pressable
            style={[styles.secondaryBtn, cancel.isPending ? { opacity: 0.6 } : null]}
            disabled={cancel.isPending}
            onPress={() =>
              void cancel.mutateAsync({
                subscriptionId: sub.data.subscription?.razorpaySubscriptionId ?? '',
                cancelAtPeriodEnd: true,
              })
            }
          >
            <Text style={styles.secondaryBtnText}>Cancel at period end</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Billing history</Text>
        {history.isLoading ? <Text style={styles.sub}>Loading…</Text> : null}
        {history.isError ? <Text style={styles.err}>{history.error.message}</Text> : null}
        <View style={{ gap: 8, marginTop: 10 }}>
          {(history.data?.items ?? []).map((i) => (
            <View key={i.id} style={styles.innerCard}>
              <Text style={styles.meta}>{i.type}</Text>
              <Text style={styles.cardTitle}>
                {i.amountInr != null ? `₹${i.amountInr}` : '—'} {i.currency ?? ''}
              </Text>
            </View>
          ))}
          {history.data && history.data.items.length === 0 ? (
            <Text style={styles.sub}>No events yet.</Text>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  title: { fontSize: 20, fontWeight: '700' },
  sub: { fontSize: 13, color: '#444' },
  err: { fontSize: 13, color: '#b91c1c' },
  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 12, backgroundColor: '#fff' },
  innerCard: { borderWidth: 1, borderColor: '#f1f1f1', borderRadius: 12, padding: 12, backgroundColor: '#fff' },
  cardTitle: { fontSize: 14, fontWeight: '700' },
  meta: { fontSize: 12, color: '#666', marginTop: 4 },
  primaryBtn: { backgroundColor: '#C2410C', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: { borderWidth: 1, borderColor: '#ddd', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  secondaryBtnText: { color: '#444', fontWeight: '700' },
});

