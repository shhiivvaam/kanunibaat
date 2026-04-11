import { StyleSheet } from 'react-native';

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import { trpc } from '@kb/api-client';

export default function TabOneScreen() {
  const health = trpc.health.useQuery(undefined, {
    retry: 1,
    staleTime: 60_000,
  });

  const apiLine = health.isPending
    ? 'API: checking…'
    : health.isError
      ? `API: unreachable (${health.error.message})`
      : health.data?.ok
        ? `API: ${health.data.service} OK`
        : 'API: unexpected response';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>KanuniBaat</Text>
      <Text style={styles.apiHint}>{apiLine}</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <EditScreenInfo path="app/(tabs)/index.tsx" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  apiHint: {
    fontSize: 13,
    opacity: 0.85,
    textAlign: 'center',
  },
  separator: {
    marginVertical: 24,
    height: 1,
    width: '80%',
  },
});
