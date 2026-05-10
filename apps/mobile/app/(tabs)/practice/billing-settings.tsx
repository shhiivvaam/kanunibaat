import { Link } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';

import { trpc } from '@jurisly/api-client';

export default function PracticeBillingSettingsScreen() {
  const q = trpc.practice.billing.firm.get.useQuery();
  const utils = trpc.useUtils();
  const upsert = trpc.practice.billing.firm.upsert.useMutation({
    onSuccess: async () => {
      hydrated.current = false;
      await utils.practice.billing.firm.get.invalidate();
    },
  });

  const [legalName, setLegalName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [gstin, setGstin] = useState('');
  const hydrated = useRef(false);

  useEffect(() => {
    const p = q.data?.profile;
    if (!p || hydrated.current) return;
    hydrated.current = true;
    setLegalName(p.legalName ?? '');
    setAddressLine1(p.addressLine1 ?? '');
    setCity(p.city ?? '');
    setGstin(p.gstin ?? '');
  }, [q.data?.profile]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Link href={'/(tabs)/practice' as never} style={styles.back}>
        <Text style={styles.backText}>← Practice</Text>
      </Link>
      <Text style={styles.title}>GST & firm</Text>
      {q.isPending ? (
        <ActivityIndicator style={{ marginTop: 16 }} />
      ) : (
        <>
          <Text style={styles.label}>Legal name</Text>
          <TextInput style={styles.input} value={legalName} onChangeText={setLegalName} />
          <Text style={[styles.label, { marginTop: 10 }]}>Address</Text>
          <TextInput style={styles.input} value={addressLine1} onChangeText={setAddressLine1} />
          <Text style={[styles.label, { marginTop: 10 }]}>City</Text>
          <TextInput style={styles.input} value={city} onChangeText={setCity} />
          <Text style={[styles.label, { marginTop: 10 }]}>GSTIN</Text>
          <TextInput style={styles.input} value={gstin} onChangeText={setGstin} />
          <Pressable
            style={[styles.btn, { marginTop: 16 }]}
            disabled={upsert.isPending}
            onPress={() =>
              void upsert.mutateAsync({
                legalName,
                addressLine1,
                city,
                gstin: gstin.trim() ? gstin.trim() : null,
              })
            }
          >
            <Text style={styles.btnText}>Save</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  back: { marginBottom: 8 },
  backText: { color: '#C2410C', fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '700', color: '#1C1917' },
  label: { fontSize: 13, fontWeight: '600', color: '#44403C' },
  input: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#D6D3D1',
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
  },
  btn: { paddingVertical: 12, borderRadius: 12, backgroundColor: '#C2410C', alignItems: 'center' },
  btnText: { fontWeight: '700', color: '#fff' },
});
