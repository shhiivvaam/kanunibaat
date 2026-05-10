import { Stack } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { trpc } from '@jurisly/api-client';

export default function NotificationsScreen() {
  const list = trpc.notifications.listDestinations.useQuery();
  const utils = trpc.useUtils();
  const disable = trpc.notifications.disableDestination.useMutation({
    onSuccess: () => void utils.notifications.listDestinations.invalidate(),
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Notifications' }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.lead}>
          This device registers for push automatically when logged in.
        </Text>
        <Text style={styles.hint}>
          Disable a destination below to stop pushes for that endpoint.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Registered destinations</Text>
          {list.isPending ? <ActivityIndicator /> : null}
          {list.isError ? <Text style={styles.err}>{list.error.message}</Text> : null}
          {(list.data ?? []).length === 0 && !list.isPending ? (
            <Text style={styles.muted}>No destinations registered yet.</Text>
          ) : null}
          {(list.data ?? []).map((d) => (
            <View key={d.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.destMain}>
                  {d.platform}
                  {d.deviceLabel ? ` · ${d.deviceLabel}` : ''} {!d.enabled ? '(disabled)' : ''}
                </Text>
              </View>
              {d.enabled ? (
                <Pressable
                  onPress={() => void disable.mutateAsync({ id: d.id })}
                  disabled={disable.isPending}
                  accessibilityRole="button"
                  accessibilityLabel={`Disable notifications for ${d.platform}`}
                >
                  <Text style={styles.disableLink}>Disable</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32, gap: 12 },
  lead: { fontSize: 14, color: '#44403C', lineHeight: 20 },
  hint: { fontSize: 13, color: '#78716C', lineHeight: 18 },
  card: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    backgroundColor: '#fff',
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1C1917' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  destMain: { fontSize: 14, color: '#44403C' },
  disableLink: { fontSize: 13, fontWeight: '700', color: '#B91C1C' },
  muted: { fontSize: 13, color: '#78716C' },
  err: { fontSize: 13, color: '#B91C1C' },
});
