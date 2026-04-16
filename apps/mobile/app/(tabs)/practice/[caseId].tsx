import * as DocumentPicker from 'expo-document-picker';
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { trpc } from '@kb/api-client';

const STATUSES = [
  'intake',
  'active',
  'hearing_scheduled',
  'pending_docs',
  'judgement',
  'closed',
  'appealed',
] as const;

const CASE_OUTCOMES = ['unknown', 'won', 'lost', 'settled', 'withdrawn'] as const;

export default function PracticeCaseDetailScreen() {
  const { caseId } = useLocalSearchParams<{ caseId: string }>();
  const id = typeof caseId === 'string' ? caseId : '';
  const utils = trpc.useUtils();

  const c = trpc.cases.case.byId.useQuery({ id }, { enabled: Boolean(id) });
  const hearings = trpc.cases.hearing.list.useQuery({ caseId: id }, { enabled: Boolean(id) });
  const tasks = trpc.cases.task.list.useQuery({ caseId: id }, { enabled: Boolean(id) });
  const documents = trpc.cases.document.list.useQuery({ caseId: id }, { enabled: Boolean(id) });
  const timeList = trpc.practice.billing.timeEntry.list.useQuery({ caseId: id }, { enabled: Boolean(id) });
  const timeActive = trpc.practice.billing.timeEntry.active.useQuery(undefined, { enabled: Boolean(id) });
  const timeStart = trpc.practice.billing.timeEntry.start.useMutation({
    onSuccess: async () => {
      await utils.practice.billing.timeEntry.list.invalidate({ caseId: id });
      await utils.practice.billing.timeEntry.active.invalidate();
    },
  });
  const timeStop = trpc.practice.billing.timeEntry.stop.useMutation({
    onSuccess: async () => {
      await utils.practice.billing.timeEntry.list.invalidate({ caseId: id });
      await utils.practice.billing.timeEntry.active.invalidate();
    },
  });

  const updateCase = trpc.cases.case.update.useMutation({
    onSuccess: async () => {
      await utils.cases.case.byId.invalidate({ id });
      await utils.cases.case.list.invalidate();
    },
  });

  const [courtName, setCourtName] = useState('');
  const [statusIdx, setStatusIdx] = useState(0);
  const [cnrInput, setCnrInput] = useState('');
  const [description, setDescription] = useState('');
  const [outcomeIdx, setOutcomeIdx] = useState(0);
  const [tick, setTick] = useState(0);
  const metaHydrated = useRef(false);

  useEffect(() => {
    metaHydrated.current = false;
  }, [id]);

  useEffect(() => {
    const row = c.data?.case;
    if (!row || metaHydrated.current) return;
    metaHydrated.current = true;
    setCourtName(row.courtName ?? '');
    const si = STATUSES.indexOf(row.status as (typeof STATUSES)[number]);
    setStatusIdx(si >= 0 ? si : 0);
    setCnrInput(row.cnrNumber ?? '');
    setDescription(row.description ?? '');
    const oi = CASE_OUTCOMES.indexOf(row.caseOutcome as (typeof CASE_OUTCOMES)[number]);
    setOutcomeIdx(oi >= 0 ? oi : 0);
  }, [c.data?.case]);

  useEffect(() => {
    if (!timeActive.data?.entry) return;
    const tmr = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(tmr);
  }, [timeActive.data?.entry?.id]);

  const hearingCreate = trpc.cases.hearing.create.useMutation({
    onSuccess: async () => {
      await utils.cases.hearing.list.invalidate({ caseId: id });
    },
  });
  const [hearingAt, setHearingAt] = useState('');
  const [judgeName, setJudgeName] = useState('');

  const taskCreate = trpc.cases.task.create.useMutation({
    onSuccess: async () => {
      await utils.cases.task.list.invalidate({ caseId: id });
    },
  });
  const taskUpdate = trpc.cases.task.update.useMutation({
    onSuccess: async () => {
      await utils.cases.task.list.invalidate({ caseId: id });
    },
  });
  const [taskTitle, setTaskTitle] = useState('');

  const requestUpload = trpc.cases.document.requestUpload.useMutation();
  const confirmUpload = trpc.cases.document.confirmUpload.useMutation();
  const presignDownload = trpc.cases.document.presignDownload.useMutation();
  const deleteDoc = trpc.cases.document.delete.useMutation({
    onSuccess: async () => {
      await utils.cases.document.list.invalidate({ caseId: id });
    },
  });

  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  const [lookupInput, setLookupInput] = useState('');
  const [lookupState, setLookupState] = useState<
    { kind: 'idle' } | { kind: 'loading' } | { kind: 'ok'; snapshot: unknown } | { kind: 'err'; message: string }
  >({ kind: 'idle' });

  async function pickAndUpload() {
    if (!id) return;
    setUploadErr(null);
    setUploadBusy(true);
    try {
      const pick = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (pick.canceled || !pick.assets?.[0]?.uri) {
        setUploadBusy(false);
        return;
      }
      const asset = pick.assets[0];
      const uri = asset.uri;
      const fileRes = await fetch(uri);
      const buf = await fileRes.arrayBuffer();
      const byteSize = buf.byteLength;
      const fileName = asset.name ?? 'document';
      const contentType = asset.mimeType ?? 'application/octet-stream';

      const requested = await requestUpload.mutateAsync({
        caseId: id,
        fileName,
        contentType,
        byteSize,
        visibleToClient: false,
      });

      const put = await fetch(requested.uploadUrl, {
        method: 'PUT',
        body: buf,
        headers: { 'Content-Type': contentType },
      });
      if (!put.ok) throw new Error(`Upload failed (${put.status}).`);

      await confirmUpload.mutateAsync({
        documentId: requested.documentId,
        caseId: id,
        byteSize,
      });
      await utils.cases.document.list.invalidate({ caseId: id });
    } catch (e) {
      setUploadErr(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploadBusy(false);
    }
  }

  if (!id) {
    return <Text style={styles.errorPad}>Invalid case.</Text>;
  }
  if (c.isPending) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (c.isError) {
    return <Text style={styles.errorPad}>{c.error.message}</Text>;
  }

  const row = c.data.case;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Link href={'/(tabs)/practice/cases' as never} style={styles.back}>
        <Text style={styles.backText}>← Cases</Text>
      </Link>
      <Text style={styles.title}>{row.courtName || row.caseType || 'Case'}</Text>
      <Text style={styles.meta}>
        {row.status}
        {row.cnrNumber ? ` · CNR ${row.cnrNumber}` : ''}
      </Text>

      <Text style={styles.section}>Details</Text>
      <Text style={styles.label}>Court / title</Text>
      <TextInput style={styles.input} value={courtName} onChangeText={setCourtName} />
      <Text style={[styles.label, { marginTop: 10 }]}>Status</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
        {STATUSES.map((s, i) => (
          <Pressable key={s} style={[styles.chip, statusIdx === i && styles.chipOn]} onPress={() => setStatusIdx(i)}>
            <Text style={[styles.chipText, statusIdx === i && styles.chipTextOn]}>{s}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={[styles.label, { marginTop: 10 }]}>CNR</Text>
      <TextInput style={styles.input} value={cnrInput} onChangeText={setCnrInput} />
      <Text style={[styles.label, { marginTop: 10 }]}>Description</Text>
      <TextInput style={[styles.input, { minHeight: 72 }]} value={description} onChangeText={setDescription} multiline />
      <Text style={[styles.label, { marginTop: 10 }]}>Outcome (for analytics)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
        {CASE_OUTCOMES.map((s, i) => (
          <Pressable key={s} style={[styles.chip, outcomeIdx === i && styles.chipOn]} onPress={() => setOutcomeIdx(i)}>
            <Text style={[styles.chipText, outcomeIdx === i && styles.chipTextOn]}>{s}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Link href={`/(tabs)/practice/invoices?caseId=${encodeURIComponent(id)}` as never} style={[styles.btnSecondary, { marginTop: 12 }]}>
        <Text style={styles.btnSecondaryText}>New invoice for this case</Text>
      </Link>
      <Pressable
        style={styles.btn}
        disabled={updateCase.isPending}
        onPress={() =>
          void updateCase.mutateAsync({
            id,
            courtName: courtName.trim() || undefined,
            status: STATUSES[statusIdx],
            cnrNumber: cnrInput.trim() || null,
            description: description.trim(),
            caseOutcome: CASE_OUTCOMES[outcomeIdx],
          })
        }
      >
        <Text style={styles.btnText}>Save</Text>
      </Pressable>
      {updateCase.error ? <Text style={styles.error}>{updateCase.error.message}</Text> : null}

      <Text style={styles.section}>Billable time</Text>
      {timeActive.data?.entry && timeActive.data.entry.caseId === id ? (
        <View style={{ marginTop: 8, padding: 12, borderRadius: 12, backgroundColor: '#fffbeb' }}>
          <Text style={styles.muted}>
            Running…{' '}
            {(() => {
              void tick;
              const secs = Math.floor(
                (Date.now() - new Date(timeActive.data!.entry!.startedAt).getTime()) / 1000,
              );
              return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
            })()}
          </Text>
          <Pressable
            style={[styles.btn, { marginTop: 8 }]}
            disabled={timeStop.isPending}
            onPress={() => void timeStop.mutateAsync({ id: timeActive.data.entry!.id })}
          >
            <Text style={styles.btnText}>Stop</Text>
          </Pressable>
        </View>
      ) : timeActive.data?.entry ? (
        <Pressable
          style={[styles.btnSecondary, { marginTop: 8 }]}
          disabled={timeStop.isPending}
          onPress={() => void timeStop.mutateAsync({ id: timeActive.data.entry!.id })}
        >
          <Text style={styles.btnSecondaryText}>Stop timer on another case</Text>
        </Pressable>
      ) : (
        <Pressable
          style={[styles.btn, { marginTop: 8, backgroundColor: '#15803d' }]}
          disabled={timeStart.isPending}
          onPress={() => void timeStart.mutateAsync({ caseId: id })}
        >
          <Text style={styles.btnText}>Start timer</Text>
        </Pressable>
      )}
      {(timeList.data ?? []).slice(0, 8).map((e) => (
        <Text key={e.id} style={styles.row}>
          {new Date(e.startedAt).toLocaleString()}
          {e.durationSeconds != null ? ` · ${(e.durationSeconds / 3600).toFixed(2)}h` : ''}
        </Text>
      ))}

      <Text style={styles.section}>Court lookup (CNR)</Text>
      <TextInput style={styles.input} value={lookupInput} onChangeText={setLookupInput} placeholder="CNR" />
      <Pressable
        style={[styles.btnSecondary, { marginTop: 8 }]}
        onPress={() => {
          const cnr = lookupInput.trim();
          if (!cnr) {
            setLookupState({ kind: 'err', message: 'Enter a CNR.' });
            return;
          }
          setLookupState({ kind: 'loading' });
          void (async () => {
            try {
              const data = await utils.cases.court.lookupByCnr.fetch({ cnr });
              setLookupState({ kind: 'ok', snapshot: data.snapshot });
            } catch (e) {
              setLookupState({
                kind: 'err',
                message: e instanceof Error ? e.message : 'Lookup failed.',
              });
            }
          })();
        }}
      >
        <Text style={styles.btnSecondaryText}>Run lookup</Text>
      </Pressable>
      {lookupState.kind === 'loading' ? <Text style={styles.muted}>Looking up…</Text> : null}
      {lookupState.kind === 'err' ? <Text style={styles.error}>{lookupState.message}</Text> : null}
      {lookupState.kind === 'ok' ? (
        <Text style={styles.json}>{JSON.stringify(lookupState.snapshot, null, 2)}</Text>
      ) : null}

      <Text style={styles.section}>Hearings</Text>
      <Text style={styles.hint}>Enter ISO datetime e.g. 2026-04-20T10:00</Text>
      <TextInput style={styles.input} value={hearingAt} onChangeText={setHearingAt} placeholder="2026-04-20T10:00" />
      <TextInput style={[styles.input, { marginTop: 8 }]} value={judgeName} onChangeText={setJudgeName} placeholder="Judge" />
      <Pressable
        style={[styles.btn, { marginTop: 8 }]}
        disabled={!hearingAt || hearingCreate.isPending}
        onPress={() => {
          const d = new Date(hearingAt);
          if (!Number.isNaN(d.getTime())) {
            void hearingCreate.mutateAsync({
              caseId: id,
              hearingAt: d,
              judgeName: judgeName.trim() || null,
            });
          }
        }}
      >
        <Text style={styles.btnText}>Add hearing</Text>
      </Pressable>
      {(hearings.data?.hearings ?? []).map((h) => (
        <Text key={h.id} style={styles.row}>
          {new Date(h.hearingAt).toLocaleString()}
          {h.judgeName ? ` · ${h.judgeName}` : ''}
        </Text>
      ))}

      <Text style={styles.section}>Tasks</Text>
      <TextInput style={styles.input} value={taskTitle} onChangeText={setTaskTitle} placeholder="Title" />
      <Pressable
        style={[styles.btn, { marginTop: 8 }]}
        disabled={!taskTitle.trim() || taskCreate.isPending}
        onPress={() =>
          void taskCreate.mutateAsync({
            caseId: id,
            title: taskTitle.trim(),
            dueAt: null,
          })
        }
      >
        <Text style={styles.btnText}>Add task</Text>
      </Pressable>
      {(tasks.data?.tasks ?? []).map((t) => (
        <View key={t.id} style={styles.taskRow}>
          <Text style={styles.row}>
            {t.title} · {t.status}
          </Text>
          {t.status === 'open' ? (
            <Pressable
              onPress={() =>
                void taskUpdate.mutateAsync({
                  id: t.id,
                  caseId: id,
                  status: 'done',
                })
              }
            >
              <Text style={styles.link}>Done</Text>
            </Pressable>
          ) : null}
        </View>
      ))}

      <Text style={styles.section}>Documents</Text>
      {uploadErr ? <Text style={styles.error}>{uploadErr}</Text> : null}
      <Pressable style={styles.btn} disabled={uploadBusy} onPress={() => void pickAndUpload()}>
        {uploadBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Pick file & upload</Text>}
      </Pressable>
      {(documents.data?.documents ?? []).map((d) => (
        <View key={d.id} style={styles.docRow}>
          <Text style={styles.row}>
            {d.fileName} · {d.uploadStatus}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {d.uploadStatus === 'complete' ? (
              <Pressable
                onPress={async () => {
                  const { downloadUrl } = await presignDownload.mutateAsync({
                    documentId: d.id,
                    caseId: id,
                  });
                  await Linking.openURL(downloadUrl);
                }}
              >
                <Text style={styles.link}>Open</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={() => void deleteDoc.mutateAsync({ documentId: d.id, caseId: id })}>
              <Text style={styles.danger}>Delete</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 20, paddingBottom: 48 },
  errorPad: { padding: 20, color: '#b91c1c' },
  back: { marginBottom: 8 },
  backText: { color: '#C2410C', fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700', color: '#1C1917' },
  meta: { marginTop: 4, fontSize: 12, color: '#78716C' },
  section: { marginTop: 22, marginBottom: 8, fontSize: 15, fontWeight: '700', color: '#1C1917' },
  label: { fontSize: 13, fontWeight: '600', color: '#44403C' },
  hint: { fontSize: 12, color: '#78716C', marginBottom: 6 },
  input: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#D6D3D1',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    color: '#1C1917',
  },
  chipsScroll: { marginTop: 8, maxHeight: 44 },
  chip: {
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D6D3D1',
  },
  chipOn: { backgroundColor: '#1C1917', borderColor: '#1C1917' },
  chipText: { fontSize: 11, color: '#44403C' },
  chipTextOn: { color: '#fff' },
  btn: {
    marginTop: 12,
    backgroundColor: '#C2410C',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnSecondary: {
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D6D3D1',
    alignItems: 'center',
  },
  btnSecondaryText: { fontWeight: '700', color: '#44403C' },
  error: { color: '#b91c1c', marginTop: 8 },
  muted: { marginTop: 8, color: '#57534E' },
  json: { marginTop: 8, fontSize: 11, color: '#44403C', fontFamily: 'monospace' },
  row: { marginTop: 8, fontSize: 13, color: '#44403C' },
  taskRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  link: { color: '#C2410C', fontWeight: '600', fontSize: 13 },
  danger: { color: '#b91c1c', fontWeight: '600', fontSize: 13 },
  docRow: { marginTop: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E7E5E4' },
});
