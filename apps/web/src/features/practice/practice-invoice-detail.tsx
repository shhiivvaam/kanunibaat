'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { trpc } from '@kb/api-client';
import type { RouterOutputs } from '@kb/trpc';

import { getRazorpayCtor, loadRazorpayCheckoutScript } from '@/features/consultations/razorpay';
type ByIdOutput = RouterOutputs['practice']['billing']['invoice']['byId'];
type InvoiceRow = NonNullable<ByIdOutput['invoice']>;

interface RazorpayHandlerResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

function InvoiceDetailBody({
  invoiceId,
  invoice,
  lines,
  payments,
}: {
  invoiceId: string;
  invoice: InvoiceRow;
  lines: ByIdOutput['lines'];
  payments: ByIdOutput['payments'];
}) {
  const utils = trpc.useUtils();
  const [clientName, setClientName] = useState(() => invoice.clientName ?? '');
  const [clientAddress, setClientAddress] = useState(() => invoice.clientAddress ?? '');
  const [placeOfSupply, setPlaceOfSupply] = useState(() => invoice.placeOfSupply ?? '');
  const [supplyType, setSupplyType] = useState<'intrastate' | 'interstate'>(
    () => invoice.supplyType as 'intrastate' | 'interstate',
  );
  const [lineDesc, setLineDesc] = useState('');
  const [lineRate, setLineRate] = useState('2000');
  const [lineQty, setLineQty] = useState('1');
  const [payBusy, setPayBusy] = useState(false);

  const updateMeta = trpc.practice.billing.invoice.updateDraftMeta.useMutation({
    onSuccess: async () => {
      await utils.practice.billing.invoice.byId.invalidate({ id: invoiceId });
    },
  });
  const addLine = trpc.practice.billing.invoice.addLine.useMutation({
    onSuccess: async () => {
      await utils.practice.billing.invoice.byId.invalidate({ id: invoiceId });
      setLineDesc('');
    },
  });
  const delLine = trpc.practice.billing.invoice.deleteLine.useMutation({
    onSuccess: async () => {
      await utils.practice.billing.invoice.byId.invalidate({ id: invoiceId });
    },
  });
  const finalize = trpc.practice.billing.invoice.finalize.useMutation({
    onSuccess: async () => {
      await utils.practice.billing.invoice.byId.invalidate({ id: invoiceId });
      await utils.practice.billing.invoice.list.invalidate();
    },
  });
  const voidInv = trpc.practice.billing.invoice.void.useMutation({
    onSuccess: async () => {
      await utils.practice.billing.invoice.byId.invalidate({ id: invoiceId });
      await utils.practice.billing.invoice.list.invalidate();
    },
  });
  const createOrder = trpc.practice.billing.invoice.createPaymentOrder.useMutation();
  const verify = trpc.practice.billing.invoice.verifyPayment.useMutation({
    onSuccess: async () => {
      await utils.practice.billing.invoice.byId.invalidate({ id: invoiceId });
      await utils.practice.billing.invoice.list.invalidate();
    },
  });
  const attachTime = trpc.practice.billing.invoice.attachUnbilledTime.useMutation({
    onSuccess: async () => {
      await utils.practice.billing.invoice.byId.invalidate({ id: invoiceId });
    },
  });

  async function saveMeta() {
    await updateMeta.mutateAsync({
      id: invoiceId,
      clientName: clientName.trim() || invoice.clientName,
      clientAddress,
      placeOfSupply,
      supplyType,
    });
  }

  async function onPay() {
    setPayBusy(true);
    try {
      const ord = await createOrder.mutateAsync({ invoiceId: invoice.id });
      await loadRazorpayCheckoutScript();
      const Razorpay = getRazorpayCtor();
      const rzp = new Razorpay({
        key: ord.keyId,
        amount: ord.amountPaise,
        currency: ord.currency,
        order_id: ord.orderId,
        name: 'KanuniBaat',
        description: `Invoice ${invoice.invoiceNumber}`,
        handler: async (response: RazorpayHandlerResponse) => {
          await verify.mutateAsync({
            invoiceId: invoice.id,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          setPayBusy(false);
        },
        modal: {
          ondismiss: () => setPayBusy(false),
        },
      });
      rzp.open();
    } catch {
      setPayBusy(false);
    }
  }

  async function downloadPdf() {
    const r = await utils.practice.billing.invoice.pdfBase64.fetch({ id: invoiceId });
    const bytes = Uint8Array.from(atob(r.base64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = r.fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  function shareWhatsapp() {
    const text = `Invoice ${invoice.invoiceNumber} from KanuniBaat — total ₹${invoice.totalInr}.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  const canEdit = invoice.status === 'draft';
  const canPay = invoice.status === 'sent' || invoice.status === 'partially_paid';

  return (
    <div className="space-y-8" style={{ fontFamily: 'var(--font-body)' }}>
      <div>
        <Link href="/app/practice/invoices" className="text-sm text-[#C2410C] hover:underline">
          ← Invoices
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
          {invoice.invoiceNumber}
        </h1>
        <p className="mt-1 text-xs text-[#78716C]">
          {invoice.status} · Total ₹{invoice.totalInr} (taxable ₹{invoice.taxableInr})
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-xl border border-[#D6D3D1] bg-white px-4 py-2 text-sm font-semibold text-[#44403C] hover:bg-[#FAFAF9]"
          onClick={() => void downloadPdf()}
        >
          Download PDF
        </button>
        <button
          type="button"
          className="rounded-xl border border-[#D6D3D1] bg-white px-4 py-2 text-sm font-semibold text-[#44403C] hover:bg-[#FAFAF9]"
          onClick={shareWhatsapp}
        >
          Share (WhatsApp)
        </button>
        {canPay ? (
          <button
            type="button"
            className="rounded-xl bg-[#C2410C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9a3409] disabled:opacity-60"
            disabled={payBusy || createOrder.isPending}
            onClick={() => void onPay()}
          >
            Collect payment (Razorpay)
          </button>
        ) : null}
        {canEdit ? (
          <button
            type="button"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-900 hover:bg-red-100"
            disabled={voidInv.isPending}
            onClick={() => void voidInv.mutateAsync({ id: invoiceId })}
          >
            Void draft
          </button>
        ) : null}
      </div>

      {invoice.caseId && canEdit ? (
        <section className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[#1C1917]">Time entries</h2>
          <p className="mt-1 text-xs text-[#78716C]">Pull unbilled timer hours onto this invoice as lines.</p>
          <button
            type="button"
            className="mt-3 rounded-xl border border-[#D6D3D1] bg-white px-4 py-2 text-sm font-semibold text-[#44403C] hover:bg-[#FAFAF9]"
            disabled={attachTime.isPending}
            onClick={() => void attachTime.mutateAsync({ invoiceId, caseId: invoice.caseId! })}
          >
            Attach unbilled time
          </button>
          {attachTime.error ? <p className="mt-2 text-sm text-red-700">{attachTime.error.message}</p> : null}
        </section>
      ) : null}

      {canEdit ? (
        <section className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[#1C1917]">Client & GST</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="text-[#44403C]">Client name</span>
              <input
                className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-[#44403C]">Client address</span>
              <textarea
                className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
                rows={2}
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-[#44403C]">Place of supply</span>
              <input
                className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
                value={placeOfSupply}
                onChange={(e) => setPlaceOfSupply(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-[#44403C]">Supply type</span>
              <select
                className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
                value={supplyType}
                onChange={(e) => setSupplyType(e.target.value as 'intrastate' | 'interstate')}
              >
                <option value="intrastate">Intrastate (CGST+SGST)</option>
                <option value="interstate">Interstate (IGST)</option>
              </select>
            </label>
          </div>
          <button
            type="button"
            className="mt-3 rounded-xl border border-[#D6D3D1] bg-white px-4 py-2 text-sm font-semibold text-[#44403C] hover:bg-[#FAFAF9]"
            onClick={() => void saveMeta()}
            disabled={updateMeta.isPending}
          >
            Save meta
          </button>
        </section>
      ) : null}

      <section className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-[#1C1917]">Lines</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {lines.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F5F5F4] py-2 last:border-0">
              <span className="text-[#44403C]">{l.description}</span>
              <span className="tabular-nums text-[#78716C]">
                ₹{l.taxableInr} · {l.taxRatePercent}% GST
              </span>
              {canEdit ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-red-700 hover:underline"
                  onClick={() => void delLine.mutateAsync({ invoiceId, lineId: l.id })}
                >
                  Remove
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        {canEdit ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            <input
              className="rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm sm:col-span-2"
              placeholder="Description"
              value={lineDesc}
              onChange={(e) => setLineDesc(e.target.value)}
            />
            <input
              className="rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
              placeholder="Qty"
              value={lineQty}
              onChange={(e) => setLineQty(e.target.value)}
            />
            <input
              className="rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
              placeholder="Rate INR"
              value={lineRate}
              onChange={(e) => setLineRate(e.target.value)}
            />
            <button
              type="button"
              className="rounded-xl bg-[#C2410C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9a3409] sm:col-span-4"
              disabled={addLine.isPending}
              onClick={() =>
                void addLine.mutateAsync({
                  invoiceId,
                  description: lineDesc.trim() || 'Line item',
                  quantity: Number(lineQty) || 1,
                  unitRateInr: Math.max(0, Math.floor(Number(lineRate) || 0)),
                })
              }
            >
              Add line
            </button>
          </div>
        ) : null}
        {canEdit ? (
          <button
            type="button"
            className="mt-4 rounded-xl bg-[#15803d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#166534]"
            disabled={finalize.isPending || lines.length === 0}
            onClick={() => void finalize.mutateAsync({ id: invoiceId })}
          >
            Finalize & assign invoice number
          </button>
        ) : null}
      </section>

      {payments.length > 0 ? (
        <section className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[#1C1917]">Payments</h2>
          <ul className="mt-2 text-sm text-[#57534E]">
            {payments.map((p) => (
              <li key={p.id}>
                {p.status} · ₹{p.amountInr}
                {p.paidAt ? ` · ${new Date(p.paidAt).toLocaleString()}` : ''}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export function PracticeInvoiceDetail() {
  const params = useParams();
  const invoiceId = typeof params.invoiceId === 'string' ? params.invoiceId : '';

  const q = trpc.practice.billing.invoice.byId.useQuery({ id: invoiceId }, { enabled: Boolean(invoiceId) });
  const inv = q.data?.invoice;
  const lines = q.data?.lines ?? [];
  const payments = q.data?.payments ?? [];

  if (!invoiceId) return <p className="text-sm text-red-700">Invalid invoice.</p>;
  if (q.isPending) return <p className="text-sm text-[#57534E]">Loading…</p>;
  if (q.isError) return <p className="text-sm text-red-700">{q.error.message}</p>;
  if (!inv) return null;

  return (
    <InvoiceDetailBody key={invoiceId} invoiceId={invoiceId} invoice={inv} lines={lines} payments={payments} />
  );
}
