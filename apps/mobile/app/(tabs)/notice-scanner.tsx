import * as DocumentPicker from 'expo-document-picker';
import * as Localization from 'expo-localization';
import Constants from 'expo-constants';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { trpc } from '@jurisly/api-client';

type ScanPhase = 'idle' | 'busy' | 'done' | 'error';

export default function NoticeScannerScreen() {
  const requestUpload = trpc.notices.requestUpload.useMutation();
  const confirmUpload = trpc.notices.confirmUpload.useMutation();
  const processScan = trpc.notices.process.useMutation();

  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [err, setErr] = useState<string | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const locale = Localization.getLocales()[0]?.languageCode?.slice(0, 16) ?? 'en';

  const scanQuery = trpc.notices.get.useQuery(
    scanId && accessToken ? { scanId, accessToken } : (undefined as never),
    {
      enabled: Boolean(scanId && accessToken && phase !== 'idle'),
      refetchInterval: phase === 'busy' ? 1500 : false,
    },
  );

  const scan = scanQuery.data?.scan ?? null;

  const webShareBase =
    typeof process !== 'undefined'
      ? process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '')
      : undefined;
  const canonicalWeb =
    webShareBase ||
    (typeof Constants.expoConfig?.extra?.webUrl === 'string'
      ? (Constants.expoConfig.extra.webUrl as string).replace(/\/$/, '')
      : undefined) ||
    'https://tryjurisly.com';

  const shareUrl = useMemo(() => {
    if (!scanId || !accessToken) return null;
    return `${canonicalWeb}/notice-scanner/result/${scanId}?t=${encodeURIComponent(accessToken)}`;
  }, [scanId, accessToken, canonicalWeb]);

  async function runPickAndScan() {
    setErr(null);
    setPhase('idle');
    const pick = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    });
    if (pick.canceled || !pick.assets?.[0]?.uri || !pick.assets[0]?.name) {
      return;
    }
    const asset = pick.assets[0];
    const uri = asset.uri;
    const name = asset.name ?? 'notice';
    const contentType =
      typeof asset.mimeType === 'string' && asset.mimeType.length > 0
        ? asset.mimeType
        : 'application/octet-stream';

    try {
      setPhase('busy');
      const buf = await fetch(uri);
      const plain = new Uint8Array(await buf.arrayBuffer());

      const requested = await requestUpload.mutateAsync({
        fileName: name.slice(0, 200),
        contentType,
        byteSize: plain.byteLength,
        locale,
      });
      setScanId(requested.scanId);
      setAccessToken(requested.accessToken);

      const put = await fetch(requested.uploadUrl, {
        method: 'PUT',
        body: plain as unknown as BodyInit,
        headers: { 'Content-Type': contentType },
      });
      if (!put.ok) throw new Error(`Upload failed (${put.status}).`);

      await confirmUpload.mutateAsync({
        scanId: requested.scanId,
        accessToken: requested.accessToken,
      });

      await processScan.mutateAsync({
        scanId: requested.scanId,
        accessToken: requested.accessToken,
      });
      setPhase('done');
    } catch (e) {
      setPhase('error');
      setErr(e instanceof Error ? e.message : 'Scan failed.');
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Notice Scanner</Text>
      <Text style={styles.lead}>
        Upload a PDF or photo. OCR runs on the server and you get a plain-language summary. This is
        general information—not legal advice.
      </Text>

      <Pressable
        style={[styles.btn, phase === 'busy' ? styles.btnDisabled : null]}
        disabled={phase === 'busy'}
        onPress={() => void runPickAndScan()}
      >
        {phase === 'busy' ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Choose file & scan</Text>
        )}
      </Pressable>

      {err ? <Text style={styles.error}>{err}</Text> : null}

      {scan ? (
        <View style={styles.card}>
          <Text style={styles.section}>Result ({scan.status})</Text>
          {scan.failureReason ? <Text style={styles.error}>{scan.failureReason}</Text> : null}
          {scan.aiSummary ? <Text style={styles.summary}>{scan.aiSummary}</Text> : null}
          {Array.isArray(scan.recommendedActions) && scan.recommendedActions.length > 0 ? (
            <View style={{ marginTop: 12, gap: 8 }}>
              {(scan.recommendedActions as string[]).map((a, idx) => (
                <Text key={`${idx}-${a.slice(0, 48)}`} style={styles.bullet}>
                  {idx + 1}. {a}
                </Text>
              ))}
            </View>
          ) : null}
          {shareUrl ? (
            <Pressable
              style={[styles.secondary, { marginTop: 14 }]}
              onPress={() => void Share.share({ message: shareUrl })}
            >
              <Text style={styles.secondaryText}>Share link</Text>
            </Pressable>
          ) : null}
        </View>
      ) : scanQuery.isPending && phase !== 'idle' ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '700', color: '#1C1917', marginBottom: 8 },
  lead: { fontSize: 14, color: '#57534E', lineHeight: 20, marginBottom: 16 },
  btn: {
    backgroundColor: '#C2410C',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  secondary: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  secondaryText: { color: '#44403C', fontWeight: '700' },
  error: { color: '#B91C1C', marginTop: 12, fontSize: 14 },
  card: {
    marginTop: 20,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  section: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78716C',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summary: { fontSize: 14, color: '#292524', lineHeight: 20 },
  bullet: { fontSize: 14, color: '#292524', lineHeight: 20 },
});
