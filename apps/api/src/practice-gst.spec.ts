import { aggregateInvoiceTax, indianFyStartYear, lineTaxAmount } from '@kb/trpc';

describe('Phase 10 GST helpers', () => {
  it('computes line tax with half-up rounding', () => {
    expect(lineTaxAmount({ taxableInr: 100, taxRatePercent: 18 })).toBe(18);
    expect(lineTaxAmount({ taxableInr: 101, taxRatePercent: 18 })).toBe(18);
  });

  it('splits intrastate GST into CGST/SGST', () => {
    const t = aggregateInvoiceTax([{ taxableInr: 1000, taxRatePercent: 18 }], 'intrastate');
    expect(t.taxableInr).toBe(1000);
    expect(t.cgstInr + t.sgstInr).toBe(180);
    expect(t.igstInr).toBe(0);
    expect(t.totalInr).toBe(1180);
  });

  it('uses IGST for interstate', () => {
    const t = aggregateInvoiceTax([{ taxableInr: 500, taxRatePercent: 18 }], 'interstate');
    expect(t.igstInr).toBe(90);
    expect(t.cgstInr).toBe(0);
    expect(t.sgstInr).toBe(0);
    expect(t.totalInr).toBe(590);
  });
});

describe('Indian FY start year', () => {
  it('uses April as FY boundary', () => {
    expect(indianFyStartYear(new Date('2026-03-31'))).toBe(2025);
    expect(indianFyStartYear(new Date('2026-04-01'))).toBe(2026);
  });
});
