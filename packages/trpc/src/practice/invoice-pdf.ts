import { PDFDocument, StandardFonts } from 'pdf-lib';

export async function renderInvoicePdfBase64(opts: {
  invoiceNumber: string;
  issueDateIso: string;
  dueDateIso: string | null;
  supplyType: string;
  lawyerLegalName: string;
  lawyerAddress: string;
  lawyerGstin: string | null;
  clientName: string;
  clientAddress: string;
  clientGstin: string | null;
  placeOfSupply: string;
  lines: {
    description: string;
    quantity: number;
    unitRateInr: number;
    taxableInr: number;
    taxRatePercent: number;
  }[];
  taxableInr: number;
  cgstInr: number;
  sgstInr: number;
  igstInr: number;
  totalInr: number;
  notes: string;
}): Promise<string> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let y = 800;
  const left = 50;
  const lineH = 14;

  const draw = (text: string, size = 10, useBold = false) => {
    page.drawText(text, { x: left, y, size, font: useBold ? bold : font });
    y -= lineH;
  };

  draw('Tax invoice', 16, true);
  y -= 4;
  draw(`Invoice no: ${opts.invoiceNumber}`, 11, true);
  draw(`Issue date: ${opts.issueDateIso}`);
  if (opts.dueDateIso) draw(`Due date: ${opts.dueDateIso}`);
  draw(`Supply: ${opts.supplyType}`);
  y -= 6;
  draw('Supplier', 11, true);
  draw(opts.lawyerLegalName || '—');
  for (const part of opts.lawyerAddress.split('\n').slice(0, 4)) {
    draw(part || ' ');
  }
  if (opts.lawyerGstin) draw(`GSTIN: ${opts.lawyerGstin}`);
  y -= 6;
  draw('Bill to', 11, true);
  draw(opts.clientName || '—');
  for (const part of opts.clientAddress.split('\n').slice(0, 3)) {
    draw(part || ' ');
  }
  if (opts.clientGstin) draw(`GSTIN: ${opts.clientGstin}`);
  draw(`Place of supply: ${opts.placeOfSupply || '—'}`);
  y -= 8;
  draw('Line items', 11, true);
  draw('Description | Qty | Rate | Taxable | GST%');
  for (const l of opts.lines) {
    const row = `${l.description.slice(0, 40)} | ${l.quantity} | ₹${l.unitRateInr} | ₹${l.taxableInr} | ${l.taxRatePercent}%`;
    draw(row, 9);
  }
  y -= 6;
  draw(`Taxable: ₹${opts.taxableInr}`);
  if (opts.cgstInr) draw(`CGST: ₹${opts.cgstInr}`);
  if (opts.sgstInr) draw(`SGST: ₹${opts.sgstInr}`);
  if (opts.igstInr) draw(`IGST: ₹${opts.igstInr}`);
  draw(`Total: ₹${opts.totalInr}`, 12, true);
  if (opts.notes.trim()) {
    y -= 8;
    draw('Notes', 10, true);
    draw(opts.notes.slice(0, 500), 9);
  }

  const bytes = await doc.save();
  return Buffer.from(bytes).toString('base64');
}
