'use client';

import Link from 'next/link';
import { useState } from 'react';

import { trpc } from '@kb/api-client';
import type { RouterOutputs } from '@kb/trpc';

type FirmProfileRow = NonNullable<RouterOutputs['practice']['billing']['firm']['get']['profile']>;

function FirmProfileForm({
  profile,
  onSave,
  isSaving,
  errorMessage,
}: {
  profile: FirmProfileRow | null;
  onSave: (values: {
    legalName: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    stateCode: string;
    pincode: string;
    gstin: string;
    pan: string;
    defaultHsnSac: string;
    invoicePrefix: string;
  }) => Promise<void>;
  isSaving: boolean;
  errorMessage: string | null;
}) {
  const [legalName, setLegalName] = useState(() => profile?.legalName ?? '');
  const [addressLine1, setAddressLine1] = useState(() => profile?.addressLine1 ?? '');
  const [addressLine2, setAddressLine2] = useState(() => profile?.addressLine2 ?? '');
  const [city, setCity] = useState(() => profile?.city ?? '');
  const [stateCode, setStateCode] = useState(() => profile?.stateCode ?? '');
  const [pincode, setPincode] = useState(() => profile?.pincode ?? '');
  const [gstin, setGstin] = useState(() => profile?.gstin ?? '');
  const [pan, setPan] = useState(() => profile?.pan ?? '');
  const [defaultHsnSac, setDefaultHsnSac] = useState(() => profile?.defaultHsnSac ?? '998212');
  const [invoicePrefix, setInvoicePrefix] = useState(() => profile?.invoicePrefix ?? 'INV');

  return (
    <section className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2">
          <span className="text-[#44403C]">Legal name</span>
          <input
            className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-[#44403C]">Address line 1</span>
          <input
            className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-[#44403C]">Address line 2</span>
          <input
            className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
            value={addressLine2}
            onChange={(e) => setAddressLine2(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-[#44403C]">City</span>
          <input
            className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-[#44403C]">State code</span>
          <input
            className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
            placeholder="e.g. KA"
            value={stateCode}
            onChange={(e) => setStateCode(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-[#44403C]">PIN</span>
          <input
            className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-[#44403C]">GSTIN</span>
          <input
            className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
            value={gstin}
            onChange={(e) => setGstin(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-[#44403C]">PAN</span>
          <input
            className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
            value={pan}
            onChange={(e) => setPan(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-[#44403C]">Default HSN/SAC</span>
          <input
            className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
            value={defaultHsnSac}
            onChange={(e) => setDefaultHsnSac(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-[#44403C]">Invoice prefix</span>
          <input
            className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
            value={invoicePrefix}
            onChange={(e) => setInvoicePrefix(e.target.value)}
          />
        </label>
      </div>
      <button
        type="button"
        className="mt-4 rounded-xl bg-[#C2410C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9a3409]"
        disabled={isSaving}
        onClick={() =>
          void onSave({
            legalName,
            addressLine1,
            addressLine2,
            city,
            stateCode,
            pincode,
            gstin,
            pan,
            defaultHsnSac,
            invoicePrefix,
          })
        }
      >
        Save
      </button>
      {errorMessage ? <p className="mt-2 text-sm text-red-700">{errorMessage}</p> : null}
    </section>
  );
}

export function PracticeBillingSettings() {
  const q = trpc.practice.billing.firm.get.useQuery();
  const utils = trpc.useUtils();
  const upsert = trpc.practice.billing.firm.upsert.useMutation({
    onSuccess: async () => {
      await utils.practice.billing.firm.get.invalidate();
    },
  });

  const profile = q.data?.profile ?? null;
  const formKey = profile ? String(profile.updatedAt) : 'new';

  return (
    <div className="space-y-8" style={{ fontFamily: 'var(--font-body)' }}>
      <div>
        <Link href="/app/practice" className="text-sm text-[#C2410C] hover:underline">
          ← Practice
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
          GST & firm details
        </h1>
        <p className="mt-1 text-sm text-[#57534E]">Used on PDF invoices and invoice numbering.</p>
      </div>

      {q.isPending ? (
        <p className="text-sm text-[#57534E]">Loading…</p>
      ) : (
        <FirmProfileForm
          key={formKey}
          profile={profile}
          isSaving={upsert.isPending}
          errorMessage={upsert.error?.message ?? null}
          onSave={async (values) => {
            await upsert.mutateAsync({
              legalName: values.legalName,
              addressLine1: values.addressLine1,
              addressLine2: values.addressLine2,
              city: values.city,
              stateCode: values.stateCode,
              pincode: values.pincode,
              gstin: values.gstin.trim() ? values.gstin.trim() : null,
              pan: values.pan.trim() ? values.pan.trim() : null,
              defaultHsnSac: values.defaultHsnSac,
              invoicePrefix: values.invoicePrefix,
            });
          }}
        />
      )}
    </div>
  );
}
