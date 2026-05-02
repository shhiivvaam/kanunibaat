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

export default function PracticeClientsScreen() {
  const utils = trpc.useUtils();
  const q = trpc.cases.client.list.useQuery();
  const create = trpc.cases.client.create.useMutation({
    onSuccess: async () => {
      await utils.cases.client.list.invalidate();
      setName('');
      setPhone('');
      setEmail('');
    },
  });

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Link href={'/(tabs)/practice' as never} style={styles.back}>
        <Text style={styles.backText}>← Practice</Text>
      </Link>

      <Text style={styles.title}>Clients</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />
      <Text style={[styles.label, { marginTop: 10 }]}>Phone</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <Text style={[styles.label, { marginTop: 10 }]}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      {create.error ? <Text style={styles.error}>{create.error.message}</Text> : null}

      <Pressable
        style={[styles.btn, (!name.trim() || create.isPending) && styles.btnDisabled]}
        disabled={!name.trim() || create.isPending}
        onPress={() =>
          void create.mutateAsync({
            displayName: name.trim(),
            phone: phone.trim() || null,
            email: email.trim() || null,
          })
        }
      >
        <Text style={styles.btnText}>Save client</Text>
      </Pressable>

      {q.isPending ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : q.isError ? (
        <Text style={[styles.error, { marginTop: 24 }]}>{q.error.message}</Text>
      ) : (
        <View style={{ marginTop: 24, gap: 10 }}>
          {(q.data?.clients ?? []).map((c) => (
            <View key={c.id} style={styles.card}>
              <Text style={styles.cardTitle}>{c.displayName}</Text>
              <Text style={styles.cardMeta}>
                {[c.phone, c.email].filter(Boolean).join(' · ') || 'No contact'}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  back: { marginBottom: 12 },
  backText: { color: '#C2410C', fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '700', color: '#1C1917', marginBottom: 16 },
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
  btn: {
    marginTop: 16,
    backgroundColor: '#C2410C',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  error: { color: '#b91c1c', marginTop: 8 },
  card: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1C1917' },
  cardMeta: { marginTop: 4, fontSize: 12, color: '#78716C' },
});
