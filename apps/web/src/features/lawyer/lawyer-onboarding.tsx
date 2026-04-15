'use client';

import { trpc } from '@kb/api-client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const DOC_KINDS = [
  { value: 'enrollment_certificate' as const, label: 'Bar enrollment certificate (PDF or image)' },
  { value: 'government_id' as const, label: 'Government-issued ID (PDF or image)' },
];

export function LawyerOnboarding() {
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
  const listDocs = trpc.lawyer.listDocuments.useQuery(undefined, {
    enabled: Boolean(profile.data?.lawyer),
  });
  const submit = trpc.lawyer.submitForReview.useMutation({
    onSuccess: () => void utils.profile.me.invalidate(),
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

  const law = profile.data?.lawyer;
  const status = law?.verificationStatus;

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

  async function onSaveProfile(e: React.FormEvent) {
    e.preventDefault();
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

  async function onUpload(kind: (typeof DOC_KINDS)[number]['value'], file: File | null) {
    setUploadMsg(null);
    if (!file) return;
    try {
      const { documentId, uploadUrl } = await requestUpload.mutateAsync({
        kind,
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        byteSize: file.size,
      });
      const put = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });
      if (!put.ok) {
        throw new Error(`Upload failed (${put.status})`);
      }
      await confirmUpload.mutateAsync({ documentId });
      setUploadMsg('File uploaded successfully.');
    } catch (err) {
      setUploadMsg(err instanceof Error ? err.message : 'Upload failed.');
    }
  }

  return (
    <div className="space-y-10" style={{ fontFamily: 'var(--font-body)' }}>
      <div>
        <h1 className="text-2xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
          Lawyer onboarding
        </h1>
        <p className="mt-2 text-sm text-[#57534E]">
          Complete your professional profile, upload required documents, then submit for admin verification. Document
          uploads require AWS S3 env on the API; until then you will see a clear configuration message.
        </p>
      </div>

      {!law ? (
        <section className="rounded-2xl border border-[#E7E5E4] bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-[#1C1917]">Start</h2>
          <p className="mt-2 text-sm text-[#57534E]">
            Create your lawyer profile shell (assigns the lawyer role and a public slug).
          </p>
          <button
            type="button"
            onClick={() => bootstrap.mutate()}
            disabled={bootstrap.isPending}
            className="mt-4 rounded-xl bg-[#C2410C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9a3409] disabled:opacity-50"
          >
            {bootstrap.isPending ? 'Working…' : 'Start lawyer profile'}
          </button>
          {bootstrap.error ? <p className="mt-2 text-sm text-red-700">{bootstrap.error.message}</p> : null}
        </section>
      ) : null}

      {law && (status === 'draft' || status === 'rejected') ? (
        <>
          {status === 'rejected' && law.rejectionReason ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <p className="font-semibold">Previous submission was rejected.</p>
              <p className="mt-1">{law.rejectionReason}</p>
            </div>
          ) : null}

          <section className="rounded-2xl border border-[#E7E5E4] bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-[#1C1917]">Professional details</h2>
            <form className="mt-4 space-y-4" onSubmit={(e) => void onSaveProfile(e)}>
              <div>
                <label className="block text-xs font-medium text-[#44403C]" htmlFor="headline">
                  Headline
                </label>
                <input
                  id="headline"
                  className="mt-1 w-full rounded-xl border border-[#E7E5E4] px-3 py-2 text-sm"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#44403C]" htmlFor="bio">
                  Bio
                </label>
                <textarea
                  id="bio"
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-[#E7E5E4] px-3 py-2 text-sm"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-[#44403C]" htmlFor="city">
                    City
                  </label>
                  <input
                    id="city"
                    className="mt-1 w-full rounded-xl border border-[#E7E5E4] px-3 py-2 text-sm"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#44403C]" htmlFor="bar">
                    Bar council state
                  </label>
                  <input
                    id="bar"
                    className="mt-1 w-full rounded-xl border border-[#E7E5E4] px-3 py-2 text-sm"
                    value={barState}
                    onChange={(e) => setBarState(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#44403C]" htmlFor="enrollment">
                  Enrollment number
                </label>
                <input
                  id="enrollment"
                  className="mt-1 w-full rounded-xl border border-[#E7E5E4] px-3 py-2 text-sm"
                  value={enrollmentNumber}
                  onChange={(e) => setEnrollmentNumber(e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-[#44403C]" htmlFor="areas">
                    Practice areas (comma-separated)
                  </label>
                  <input
                    id="areas"
                    className="mt-1 w-full rounded-xl border border-[#E7E5E4] px-3 py-2 text-sm"
                    value={practiceAreas}
                    onChange={(e) => setPracticeAreas(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#44403C]" htmlFor="langs">
                    Languages (comma-separated)
                  </label>
                  <input
                    id="langs"
                    className="mt-1 w-full rounded-xl border border-[#E7E5E4] px-3 py-2 text-sm"
                    value={languages}
                    onChange={(e) => setLanguages(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#44403C]" htmlFor="yrs">
                  Years experience
                </label>
                <input
                  id="yrs"
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-xl border border-[#E7E5E4] px-3 py-2 text-sm"
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={update.isPending}
                className="rounded-xl bg-[#1C1917] px-4 py-2 text-sm font-semibold text-white hover:bg-[#292524] disabled:opacity-50"
              >
                Save profile
              </button>
              {update.error ? <p className="text-sm text-red-700">{update.error.message}</p> : null}
            </form>
          </section>

          <section className="rounded-2xl border border-[#E7E5E4] bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-[#1C1917]">Required documents</h2>
            <ul className="mt-4 space-y-4">
              {DOC_KINDS.map((d) => (
                <li key={d.value}>
                  <p className="text-sm text-[#44403C]">{d.label}</p>
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    className="mt-2 block text-sm"
                    onChange={(e) => void onUpload(d.value, e.target.files?.[0] ?? null)}
                  />
                </li>
              ))}
            </ul>
            {uploadMsg ? <p className="mt-3 text-sm text-[#57534E]">{uploadMsg}</p> : null}
            {requestUpload.error ? (
              <p className="mt-2 text-sm text-red-700">{requestUpload.error.message}</p>
            ) : null}
            <div className="mt-4 border-t border-[#F5F5F4] pt-4">
              <h3 className="text-xs font-semibold uppercase text-[#78716C]">Uploaded</h3>
              <ul className="mt-2 text-sm text-[#44403C]">
                {(listDocs.data?.documents ?? []).map((doc) => (
                  <li key={doc.id}>
                    {doc.kind} — {doc.fileName}{' '}
                    {doc.uploadedAt ? <span className="text-green-700">(complete)</span> : <span className="text-amber-700">(pending)</span>}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="rounded-2xl border border-[#E7E5E4] bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-[#1C1917]">Submit for review</h2>
            <p className="mt-2 text-sm text-[#57534E]">
              You must have bar state, enrollment number, and both required documents uploaded before submitting.
            </p>
            <button
              type="button"
              disabled={submit.isPending}
              onClick={() => submit.mutate()}
              className="mt-4 rounded-xl bg-[#C2410C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9a3409] disabled:opacity-50"
            >
              Submit for verification
            </button>
            {submit.error ? <p className="mt-2 text-sm text-red-700">{submit.error.message}</p> : null}
          </section>
        </>
      ) : null}

      {law && (status === 'pending' || status === 'verified') ? (
        <div className="rounded-2xl border border-[#E7E5E4] bg-white p-6 text-sm text-[#44403C] shadow-sm">
          {status === 'pending' ? (
            <p>
              Your profile is <strong>pending review</strong>. We will notify you when an admin has completed
              verification.
            </p>
          ) : (
            <p>
              You are <strong className="text-green-800">verified</strong>. Your public profile:{' '}
              <Link href={`/lawyers/${law.slug}`} className="font-semibold text-[#C2410C] hover:underline">
                /lawyers/{law.slug}
              </Link>
            </p>
          )}
        </div>
      ) : null}

      <p className="text-center text-xs text-[#78716C]">
        <Link href="/app" className="text-[#C2410C] hover:underline">
          Back to account
        </Link>
      </p>
    </div>
  );
}
