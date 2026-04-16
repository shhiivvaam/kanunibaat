'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { trpc } from '@kb/api-client';

export function PracticeBillingSettings() {
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
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [pincode, setPincode] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [defaultHsnSac, setDefaultHsnSac] = useState('998212');
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const hydrated = useRef(false);

  useEffect(() => {
    hydrated.current = false;
  }, []);

  useEffect(() => {
    const p = q.data?.profile;
    if (!p || hydrated.current) return;
    hydrated.current = true;
    setLegalName(p.legalName ?? '');
    setAddressLine1(p.addressLine1 ?? '');
    setAddressLine2(p.addressLine2 ?? '');
    setCity(p.city ?? '');
    setStateCode(p.stateCode ?? '');
    setPincode(p.pincode ?? '');
    setGstin(p.gstin ?? '');
    setPan(p.pan ?? '');
    setDefaultHsnSac(p.defaultHsnSac ?? '998212');
    setInvoicePrefix(p.invoicePrefix ?? 'INV');
  }, [q.data?.profile]);

  async function onSave() {
    await upsert.mutateAsync({
      legalName,
      addressLine1,
      addressLine2,
      city,
      stateCode,
      pincode,
      gstin: gstin.trim() ? gstin.trim() : null,
      pan: pan.trim() ? pan.trim() : null,
      defaultHsnSac,
      invoicePrefix,
    });
  }

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
            disabled={upsert.isPending}
            onClick={() => void onSave()}
          >
            Save
          </button>
          {upsert.error ? <p className="mt-2 text-sm text-red-700">{upsert.error.message}</p> : null}
        </section>
      )}
    </div>
  );
}
