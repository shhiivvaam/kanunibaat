'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

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

const COURT_TYPES = ['district', 'high_court', 'supreme_court', 'tribunal', 'other'] as const;

export function PracticeCaseDetail() {
  const params = useParams();
  const caseId = typeof params.caseId === 'string' ? params.caseId : '';
  const utils = trpc.useUtils();

  const c = trpc.cases.case.byId.useQuery({ id: caseId }, { enabled: Boolean(caseId) });
  const hearings = trpc.cases.hearing.list.useQuery({ caseId }, { enabled: Boolean(caseId) });
  const tasks = trpc.cases.task.list.useQuery({ caseId }, { enabled: Boolean(caseId) });
  const documents = trpc.cases.document.list.useQuery({ caseId }, { enabled: Boolean(caseId) });

  const updateCase = trpc.cases.case.update.useMutation({
    onSuccess: async () => {
      await utils.cases.case.byId.invalidate({ id: caseId });
      await utils.cases.case.list.invalidate();
    },
  });

  const [courtName, setCourtName] = useState('');
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('intake');
  const [cnrInput, setCnrInput] = useState('');
  const [description, setDescription] = useState('');
  const metaHydrated = useRef(false);

  useEffect(() => {
    metaHydrated.current = false;
  }, [caseId]);

  useEffect(() => {
    const row = c.data?.case;
    if (!row || metaHydrated.current) return;
    metaHydrated.current = true;
    setCourtName(row.courtName ?? '');
    setStatus(row.status as (typeof STATUSES)[number]);
    setCnrInput(row.cnrNumber ?? '');
    setDescription(row.description ?? '');
  }, [c.data?.case]);

  const hearingCreate = trpc.cases.hearing.create.useMutation({
    onSuccess: async () => {
      await utils.cases.hearing.list.invalidate({ caseId });
      setHearingAt('');
      setJudgeName('');
    },
  });
  const [hearingAt, setHearingAt] = useState('');
  const [judgeName, setJudgeName] = useState('');

  const taskCreate = trpc.cases.task.create.useMutation({
    onSuccess: async () => {
      await utils.cases.task.list.invalidate({ caseId });
      setTaskTitle('');
      setTaskDue('');
    },
  });
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('');

  const requestUpload = trpc.cases.document.requestUpload.useMutation();
  const confirmUpload = trpc.cases.document.confirmUpload.useMutation();
  const presignDownload = trpc.cases.document.presignDownload.useMutation();
  const deleteDoc = trpc.cases.document.delete.useMutation({
    onSuccess: async () => {
      await utils.cases.document.list.invalidate({ caseId });
    },
  });

  const [file, setFile] = useState<File | null>(null);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);

  const [lookupInput, setLookupInput] = useState('');
  const [lookupState, setLookupState] = useState<
    { kind: 'idle' } | { kind: 'loading' } | { kind: 'ok'; snapshot: unknown } | { kind: 'err'; message: string }
  >({ kind: 'idle' });

  const taskUpdate = trpc.cases.task.update.useMutation({
    onSuccess: async () => {
      await utils.cases.task.list.invalidate({ caseId });
    },
  });

  async function onSaveMeta() {
    if (!caseId) return;
    await updateCase.mutateAsync({
      id: caseId,
      courtName: courtName.trim() || undefined,
      status,
      cnrNumber: cnrInput.trim() || null,
      description: description.trim(),
    });
  }

  async function onUpload() {
    setUploadErr(null);
    if (!file || !caseId) {
      setUploadErr('Choose a file.');
      return;
    }
    setUploadBusy(true);
    try {
      const requested = await requestUpload.mutateAsync({
        caseId,
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        byteSize: file.size,
        visibleToClient: false,
      });
      const put = await fetch(requested.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });
      if (!put.ok) throw new Error(`Upload failed (${put.status}).`);
      await confirmUpload.mutateAsync({
        documentId: requested.documentId,
        caseId,
        byteSize: file.size,
      });
      await utils.cases.document.list.invalidate({ caseId });
      setFile(null);
    } catch (e) {
      setUploadErr(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploadBusy(false);
    }
  }

  if (!caseId) {
    return <p className="text-sm text-red-700">Invalid case.</p>;
  }
  if (c.isPending) {
    return <p className="text-sm text-[#57534E]">Loading case…</p>;
  }
  if (c.isError) {
    return <p className="text-sm text-red-700">{c.error.message}</p>;
  }

  const row = c.data.case;

  return (
    <div className="space-y-10" style={{ fontFamily: 'var(--font-body)' }}>
      <div>
        <Link href="/app/practice/cases" className="text-sm text-[#C2410C] hover:underline">
          ← Cases
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
          {row.courtName || row.caseType || 'Case'}
        </h1>
        <p className="mt-1 text-xs text-[#78716C]">
          {row.status}
          {row.cnrNumber ? ` · CNR ${row.cnrNumber}` : ''}
        </p>
      </div>

      <section className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-[#1C1917]">Details</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="text-[#44403C]">Court / title</span>
            <input
              className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
              value={courtName}
              onChange={(e) => setCourtName(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-[#44403C]">Status</span>
            <select
              className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-[#44403C]">Court type</span>
            <select
              className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
              value={row.courtType}
              disabled
            >
              {COURT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-[#44403C]">CNR (saved on case)</span>
            <input
              className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
              value={cnrInput}
              onChange={(e) => setCnrInput(e.target.value)}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-[#44403C]">Description</span>
            <textarea
              className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
        </div>
        <button
          type="button"
          className="mt-3 rounded-xl bg-[#C2410C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9a3409]"
          onClick={() => void onSaveMeta()}
          disabled={updateCase.isPending}
        >
          Save
        </button>
        {updateCase.error ? <p className="mt-2 text-sm text-red-700">{updateCase.error.message}</p> : null}
      </section>

      <section className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-[#1C1917]">Court lookup (CNR)</h2>
        <p className="mt-1 text-xs text-[#78716C]">
          Requires NJDG bridge env on the API. Validates CNR and returns JSON from your bridge.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            className="min-w-[200px] flex-1 rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
            placeholder="CNR to look up"
            value={lookupInput}
            onChange={(e) => setLookupInput(e.target.value)}
          />
          <button
            type="button"
            className="rounded-xl border border-[#D6D3D1] bg-white px-3 py-2 text-sm font-semibold text-[#44403C] hover:bg-[#FAFAF9]"
            onClick={() => {
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
            Run lookup
          </button>
        </div>
        {lookupState.kind === 'loading' ? (
          <p className="mt-2 text-sm text-[#57534E]">Looking up…</p>
        ) : lookupState.kind === 'err' ? (
          <p className="mt-2 text-sm text-red-700">{lookupState.message}</p>
        ) : lookupState.kind === 'ok' ? (
          <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-[#F5F5F4] p-3 text-xs">
            {JSON.stringify(lookupState.snapshot, null, 2)}
          </pre>
        ) : null}
      </section>

      <section className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-[#1C1917]">Hearings</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            type="datetime-local"
            className="rounded-lg border border-[#D6D3D1] px-2 py-1 text-sm"
            value={hearingAt}
            onChange={(e) => setHearingAt(e.target.value)}
          />
          <input
            className="min-w-[140px] rounded-lg border border-[#D6D3D1] px-2 py-1 text-sm"
            placeholder="Judge"
            value={judgeName}
            onChange={(e) => setJudgeName(e.target.value)}
          />
          <button
            type="button"
            disabled={!hearingAt || hearingCreate.isPending}
            className="rounded-xl bg-[#1C1917] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
            onClick={() => {
              const d = new Date(hearingAt);
              if (!Number.isNaN(d.getTime())) {
                void hearingCreate.mutateAsync({
                  caseId,
                  hearingAt: d,
                  judgeName: judgeName.trim() || null,
                });
              }
            }}
          >
            Add hearing
          </button>
        </div>
        <ul className="mt-3 divide-y divide-[#E7E5E4] text-sm">
          {(hearings.data?.hearings ?? []).map((h) => (
            <li key={h.id} className="py-2">
              {new Date(h.hearingAt).toLocaleString()}
              {h.judgeName ? ` · ${h.judgeName}` : ''}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-[#1C1917]">Tasks</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            className="min-w-[180px] flex-1 rounded-lg border border-[#D6D3D1] px-2 py-1 text-sm"
            placeholder="Title"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
          />
          <input type="date" className="rounded-lg border border-[#D6D3D1] px-2 py-1 text-sm" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
          <button
            type="button"
            disabled={!taskTitle.trim() || taskCreate.isPending}
            className="rounded-xl bg-[#1C1917] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
            onClick={() =>
              void taskCreate.mutateAsync({
                caseId,
                title: taskTitle.trim(),
                dueAt: taskDue ? new Date(`${taskDue}T12:00:00`) : null,
              })
            }
          >
            Add task
          </button>
        </div>
        <ul className="mt-3 divide-y divide-[#E7E5E4] text-sm">
          {(tasks.data?.tasks ?? []).map((t) => (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>
                {t.title} · {t.status}
                {t.dueAt ? ` · due ${new Date(t.dueAt).toLocaleDateString()}` : ''}
              </span>
              {t.status === 'open' ? (
                <button
                  type="button"
                  className="text-xs text-[#C2410C] hover:underline"
                  onClick={() =>
                    void taskUpdate.mutateAsync({
                      id: t.id,
                      caseId,
                      status: 'done',
                    })
                  }
                >
                  Done
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-[#1C1917]">Documents</h2>
        <p className="mt-1 text-xs text-[#78716C]">PDF or image (JPEG/PNG/WebP), same limits as other uploads.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input type="file" accept=".pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <button
            type="button"
            disabled={uploadBusy || !file}
            className="rounded-xl bg-[#C2410C] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
            onClick={() => void onUpload()}
          >
            Upload
          </button>
        </div>
        {uploadErr ? <p className="mt-2 text-sm text-red-700">{uploadErr}</p> : null}
        <ul className="mt-4 divide-y divide-[#E7E5E4] text-sm">
          {(documents.data?.documents ?? []).map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>
                {d.fileName} · {d.uploadStatus}
              </span>
              <span className="flex gap-2">
                {d.uploadStatus === 'complete' ? (
                  <button
                    type="button"
                    className="text-xs text-[#C2410C] hover:underline"
                    onClick={async () => {
                      const { downloadUrl } = await presignDownload.mutateAsync({
                        documentId: d.id,
                        caseId,
                      });
                      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    Download
                  </button>
                ) : null}
                <button
                  type="button"
                  className="text-xs text-red-700 hover:underline"
                  onClick={() => void deleteDoc.mutateAsync({ documentId: d.id, caseId })}
                >
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
