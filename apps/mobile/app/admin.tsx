import { Stack } from 'expo-router';
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

export default function AdminScreen() {
  const utils = trpc.useUtils();
  const pending = trpc.admin.pendingLawyers.useQuery(undefined, { staleTime: 15_000 });
  const approve = trpc.admin.approveLawyer.useMutation({
    onSuccess: () => void utils.admin.pendingLawyers.invalidate(),
  });
  const reject = trpc.admin.rejectLawyer.useMutation({
    onSuccess: () => void utils.admin.pendingLawyers.invalidate(),
  });
  const [reasonByUser, setReasonByUser] = useState<Record<string, string>>({});

  return (
    <>
      <Stack.Screen options={{ title: 'Admin — lawyers' }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.intro}>
          Review pending advocates. Approve or reject is enforced on the API (admin role required).
        </Text>

        {pending.isPending ? <ActivityIndicator /> : null}
        {pending.isError ? <Text style={styles.err}>{pending.error.message}</Text> : null}

        {!pending.isPending && !pending.isError && (pending.data?.lawyers.length ?? 0) === 0 ? (
          <Text style={styles.muted}>No pending lawyers.</Text>
        ) : null}

        {(pending.data?.lawyers ?? []).map((row) => (
          <View key={row.userId} style={styles.card}>
            <Text style={styles.name}>{row.displayName ?? row.email}</Text>
            <Text style={styles.meta}>{row.email}</Text>
            <Text style={styles.line}>
              <Text style={styles.bold}>Slug:</Text> {row.slug}
            </Text>
            <Text style={styles.line}>
              <Text style={styles.bold}>Bar state:</Text> {row.barState ?? '—'}
            </Text>
            <Text style={styles.line}>
              <Text style={styles.bold}>Enrollment:</Text> {row.enrollmentNumber ?? '—'}
            </Text>
            {row.headline ? <Text style={styles.headline}>{row.headline}</Text> : null}

            <View style={styles.actions}>
              <Pressable
                style={[styles.btn, styles.approve]}
                onPress={() => approve.mutate({ userId: row.userId })}
                disabled={approve.isPending}
                accessibilityRole="button"
                accessibilityLabel={`Approve ${row.displayName ?? row.email}`}
              >
                <Text style={styles.btnApproveText}>Approve</Text>
              </Pressable>
              <TextInput
                style={styles.reason}
                placeholder="Optional rejection note"
                value={reasonByUser[row.userId] ?? ''}
                onChangeText={(t) => setReasonByUser((p) => ({ ...p, [row.userId]: t }))}
                multiline
              />
              <Pressable
                style={[styles.btn, styles.reject]}
                onPress={() =>
                  reject.mutate({
                    userId: row.userId,
                    reason: reasonByUser[row.userId]?.trim() || undefined,
                  })
                }
                disabled={reject.isPending}
                accessibilityRole="button"
              >
                <Text style={styles.rejectText}>Reject</Text>
              </Pressable>
            </View>

            <Text style={styles.docHeader}>Documents</Text>
            {row.documents.length === 0 ? (
              <Text style={styles.muted}>No document rows.</Text>
            ) : (
              row.documents.map((d) => (
                <Text key={d.id} style={styles.docLine}>
                  {d.kind} — {d.fileName} ({Math.round(d.byteSize / 1024)} KB)
                  {d.uploadedAt ? ' · uploaded' : ' · upload incomplete'}
                </Text>
              ))
            )}
          </View>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, gap: 16 },
  intro: { fontSize: 13, color: '#57534E', lineHeight: 19 },
  card: {
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#fff',
    gap: 6,
  },
  name: { fontSize: 17, fontWeight: '700', color: '#1C1917' },
  meta: { fontSize: 12, color: '#78716C' },
  line: { fontSize: 13, color: '#44403C' },
  bold: { fontWeight: '700' },
  headline: { fontSize: 13, color: '#57534E', marginTop: 4 },
  actions: { marginTop: 12, gap: 10 },
  btn: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, alignItems: 'center' },
  approve: { backgroundColor: '#166534' },
  btnApproveText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  reject: { borderWidth: 1, borderColor: '#B91C1C', backgroundColor: '#fff' },
  rejectText: { color: '#B91C1C', fontWeight: '700', fontSize: 14 },
  reason: {
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 10,
    padding: 10,
    minHeight: 56,
    fontSize: 13,
  },
  docHeader: { marginTop: 12, fontSize: 11, fontWeight: '700', color: '#78716C' },
  docLine: { fontSize: 12, color: '#44403C' },
  muted: { fontSize: 13, color: '#78716C' },
  err: { fontSize: 13, color: '#B91C1C' },
});
