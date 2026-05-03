import * as DocumentPicker from 'expo-document-picker';
import { Stack, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
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

const DOC_KINDS = [
  { value: 'enrollment_certificate' as const, label: 'Bar enrollment certificate (PDF or image)' },
  { value: 'government_id' as const, label: 'Government-issued ID (PDF or image)' },
];

export default function LawyerOnboardingScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const profile = trpc.profile.me.useQuery();
  const bootstrap = trpc.lawyer.bootstrap.useMutation({
    onSuccess: () => void utils.profile.me.invalidate(),
  });
  const update = trpc.lawyer.updateOnboarding.useMutation({
    onSuccess: () => void utils.profile.me.invalidate(),
  });
  const requestUpload = trpc.lawyer.requestDocumentUpload.useMutation();
  const confirmUpload = trpc.lawyer.confirmDocumentUpload.useMutation({
    onSuccess: () => void utils.lawyer.listDocuments.invalidate(),
  });

  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [barState, setBarState] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [practiceAreas, setPracticeAreas] = useState('');
  const [languages, setLanguages] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);

  const law = profile.data?.lawyer;
  const status = law?.verificationStatus;

  const listDocs = trpc.lawyer.listDocuments.useQuery(undefined, {
    enabled: Boolean(profile.data?.lawyer),
  });
  const barCouncilCheck = trpc.lawyer.checkBarCouncilVerification.useQuery(undefined, {
    enabled: Boolean(profile.data?.lawyer) && (status === 'draft' || status === 'rejected'),
  });
  const submit = trpc.lawyer.submitForReview.useMutation({
    onSuccess: () => void utils.profile.me.invalidate(),
  });

  const seeded = useRef(false);
  useEffect(() => {
    if (!law || seeded.current) return;
    seeded.current = true;
    setHeadline(law.headline ?? '');
    setBio(law.bio ?? '');
    setCity(law.city ?? '');
    setBarState(law.barState ?? '');
    setEnrollmentNumber(law.enrollmentNumber ?? '');
    setPracticeAreas((law.practiceAreas ?? []).join(', '));
    setLanguages((law.languages ?? []).join(', '));
    setYearsExperience(law.yearsExperience != null ? String(law.yearsExperience) : '');
  }, [law]);

  async function onSaveProfile() {
    const areas = practiceAreas
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const langs = languages
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const y = yearsExperience.trim() === '' ? null : Number.parseInt(yearsExperience, 10);
    await update.mutateAsync({
      headline: headline || undefined,
      bio: bio || undefined,
      city: city || null,
      barState: barState || null,
      enrollmentNumber: enrollmentNumber || null,
      practiceAreas: areas.length ? areas : undefined,
      languages: langs.length ? langs : undefined,
      yearsExperience: Number.isFinite(y) ? y : null,
    });
  }

  async function onPickDocument(kind: (typeof DOC_KINDS)[number]['value']) {
    setUploadMsg(null);
    setUploadBusy(true);
    try {
      const pick = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (pick.canceled || !pick.assets?.[0]) {
        setUploadBusy(false);
        return;
      }
      const asset = pick.assets[0];
      const uri = asset.uri;
      const fileRes = await fetch(uri);
      const blob = await fileRes.blob();
      const contentType = asset.mimeType || 'application/octet-stream';
      const fileName = asset.name || 'document';
      const byteSize =
        typeof asset.size === 'number' && asset.size > 0 ? asset.size : blob.size || 1;
      const { documentId, uploadUrl } = await requestUpload.mutateAsync({
        kind,
        fileName,
        contentType,
        byteSize,
      });
      const put = await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': contentType },
      });
      if (!put.ok) throw new Error(`Upload failed (${put.status})`);
      await confirmUpload.mutateAsync({ documentId });
      setUploadMsg('File uploaded successfully.');
    } catch (err) {
      setUploadMsg(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploadBusy(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Lawyer onboarding' }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.intro}>
          Complete your professional profile, upload required documents, then submit for
          verification.
        </Text>

        {!law ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Start</Text>
            <Text style={styles.cardSub}>Create your lawyer profile shell.</Text>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => bootstrap.mutate()}
              disabled={bootstrap.isPending}
            >
              <Text style={styles.primaryBtnText}>
                {bootstrap.isPending ? 'Working…' : 'Start lawyer profile'}
              </Text>
            </Pressable>
            {bootstrap.error ? <Text style={styles.err}>{bootstrap.error.message}</Text> : null}
          </View>
        ) : null}

        {law && (status === 'draft' || status === 'rejected') ? (
          <>
            {status === 'rejected' && law.rejectionReason ? (
              <View style={styles.banner}>
                <Text style={styles.bannerTitle}>Previous submission was rejected.</Text>
                <Text style={styles.bannerText}>{law.rejectionReason}</Text>
              </View>
            ) : null}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Professional details</Text>
              <Text style={styles.label}>Headline</Text>
              <TextInput style={styles.input} value={headline} onChangeText={setHeadline} />
              <Text style={styles.label}>Bio</Text>
              <TextInput style={styles.area} multiline value={bio} onChangeText={setBio} />
              <Text style={styles.label}>City</Text>
              <TextInput style={styles.input} value={city} onChangeText={setCity} />
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Bar state</Text>
                  <TextInput style={styles.input} value={barState} onChangeText={setBarState} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Enrollment</Text>
                  <TextInput
                    style={styles.input}
                    value={enrollmentNumber}
                    onChangeText={setEnrollmentNumber}
                  />
                </View>
              </View>
              <Text style={styles.label}>Practice areas (comma-separated)</Text>
              <TextInput
                style={styles.input}
                value={practiceAreas}
                onChangeText={setPracticeAreas}
              />
              <Text style={styles.label}>Languages (comma-separated)</Text>
              <TextInput style={styles.input} value={languages} onChangeText={setLanguages} />
              <Text style={styles.label}>Years experience</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={yearsExperience}
                onChangeText={setYearsExperience}
              />
              <Pressable
                style={styles.primaryBtn}
                onPress={() => void onSaveProfile()}
                disabled={update.isPending}
              >
                <Text style={styles.primaryBtnText}>
                  {update.isPending ? 'Saving…' : 'Save profile'}
                </Text>
              </Pressable>
              {update.error ? <Text style={styles.err}>{update.error.message}</Text> : null}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Required documents</Text>
              {DOC_KINDS.map((d) => (
                <View key={d.value} style={{ marginBottom: 12 }}>
                  <Text style={styles.docKind}>{d.label}</Text>
                  <Pressable
                    style={styles.pickBtn}
                    onPress={() => void onPickDocument(d.value)}
                    disabled={uploadBusy}
                  >
                    {uploadBusy ? (
                      <ActivityIndicator />
                    ) : (
                      <Text style={styles.pickBtnText}>Choose file</Text>
                    )}
                  </Pressable>
                </View>
              ))}
              {uploadMsg ? <Text style={styles.muted}>{uploadMsg}</Text> : null}
              {requestUpload.error ? (
                <Text style={styles.err}>{requestUpload.error.message}</Text>
              ) : null}
              <Text style={[styles.docHeader, { marginTop: 8 }]}>Uploaded</Text>
              {(listDocs.data?.documents ?? []).map((doc) => (
                <Text key={doc.id} style={styles.docLine}>
                  {doc.kind} — {doc.fileName}
                  {doc.uploadedAt ? ' (complete)' : ' (pending)'}
                </Text>
              ))}
            </View>

            {barCouncilCheck.data ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Bar Council verification</Text>
                <BarCouncilNotice data={barCouncilCheck.data} />
              </View>
            ) : null}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Submit for review</Text>
              <Text style={styles.cardSub}>
                Bar state, enrollment, and both required documents required.
              </Text>
              <Pressable
                style={[styles.primaryBtn, { backgroundColor: '#C2410C' }]}
                onPress={() => submit.mutate()}
                disabled={submit.isPending}
              >
                <Text style={styles.primaryBtnText}>
                  {submit.isPending ? 'Submitting…' : 'Submit for verification'}
                </Text>
              </Pressable>
              {submit.error ? <Text style={styles.err}>{submit.error.message}</Text> : null}
            </View>
          </>
        ) : null}

        {law && (status === 'pending' || status === 'verified') ? (
          <View style={styles.card}>
            {status === 'pending' ? (
              <Text style={styles.cardSub}>
                Your profile is pending review. We will notify you when verification completes.
              </Text>
            ) : (
              <Text style={styles.cardSub}>
                You are verified. Open the Lawyers tab to see your marketplace profile under your
                slug — <Text style={{ fontWeight: '700' }}>{law.slug}</Text>
              </Text>
            )}
          </View>
        ) : null}

        <Pressable onPress={() => router.replace('/(tabs)')} accessibilityRole="link">
          <Text style={styles.back}>Back to home</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

function BarCouncilNotice({ data }: { data: Record<string, unknown> }) {
  const available = data.available === true;
  const canVerify = data.canVerify === true;
  let body: ReactNode = (
    <Text style={styles.muted}>{String(data.reason ?? 'Verification unavailable.')}</Text>
  );
  if (available && canVerify) {
    const vr = data.verificationResult as Record<string, unknown> | undefined;
    const st = typeof vr?.status === 'string' ? vr.status : '';
    if (st === 'verified')
      body = <Text style={styles.success}>Enrollment automatically verified.</Text>;
    else if (st === 'unverified')
      body = (
        <Text style={styles.warn}>
          Automated verification could not confirm enrollment. Manual review applies.
        </Text>
      );
    else body = <Text style={styles.muted}>{String(vr?.message ?? 'Integration pending.')}</Text>;
  } else if (available && !canVerify)
    body = (
      <Text style={styles.muted}>{String(data.reason ?? 'Provide bar state and enrollment.')}</Text>
    );
  return <>{body}</>;
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, gap: 14 },
  intro: { fontSize: 13, color: '#57534E', lineHeight: 19 },
  card: {
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    backgroundColor: '#fff',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1C1917' },
  cardSub: { fontSize: 13, color: '#57534E', lineHeight: 19 },
  label: { marginTop: 6, fontSize: 11, fontWeight: '600', color: '#44403C' },
  input: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#D6D3D1',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
  },
  area: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#D6D3D1',
    borderRadius: 10,
    padding: 10,
    minHeight: 80,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  row: { flexDirection: 'row', gap: 10 },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: '#1C1917',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  pickBtn: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#D6D3D1',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  pickBtnText: { fontSize: 14, fontWeight: '600', color: '#44403C' },
  docKind: { fontSize: 13, color: '#44403C' },
  docHeader: { fontSize: 11, fontWeight: '700', color: '#78716C' },
  docLine: { fontSize: 12, color: '#44403C' },
  banner: {
    borderWidth: 1,
    borderColor: '#FCD34D',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
  },
  bannerTitle: { fontWeight: '700', color: '#78350F' },
  bannerText: { marginTop: 4, color: '#78350F', fontSize: 13 },
  success: { color: '#14532D', fontSize: 13 },
  warn: { color: '#7F1D1D', fontSize: 13 },
  muted: { fontSize: 13, color: '#57534E' },
  err: { fontSize: 13, color: '#B91C1C' },
  back: { textAlign: 'center', color: '#C2410C', fontWeight: '600', marginTop: 8 },
});
