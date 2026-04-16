export type SupplyType = 'intrastate' | 'interstate';

export interface LineTaxInput {
  taxableInr: number;
  taxRatePercent: number;
}

export function lineTaxAmount(line: LineTaxInput): number {
  return Math.round((line.taxableInr * line.taxRatePercent) / 100);
}

export function aggregateInvoiceTax(
  lines: LineTaxInput[],
  supplyType: SupplyType,
): { taxableInr: number; cgstInr: number; sgstInr: number; igstInr: number; totalInr: number } {
  let taxable = 0;
  let taxSum = 0;
  for (const l of lines) {
    taxable += l.taxableInr;
    taxSum += lineTaxAmount(l);
  }
  if (supplyType === 'interstate') {
    return { taxableInr: taxable, cgstInr: 0, sgstInr: 0, igstInr: taxSum, totalInr: taxable + taxSum };
  }
  const half = Math.floor(taxSum / 2);
  const cgst = half;
  const sgst = taxSum - half;
  return { taxableInr: taxable, cgstInr: cgst, sgstInr: sgst, igstInr: 0, totalInr: taxable + taxSum };
}
