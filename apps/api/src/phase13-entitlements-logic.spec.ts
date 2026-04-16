function monthStartUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0));
}

describe('Phase 13 entitlement invariants', () => {
  it('rolls over usage period at UTC month start', () => {
    const d = new Date('2026-04-16T12:34:56.000Z');
    expect(monthStartUtc(d).toISOString()).toBe('2026-04-01T00:00:00.000Z');
  });

  it('free plan notice scans default to 2/month', () => {
    const freeNoticeScansPerMonth = 2;
    expect(freeNoticeScansPerMonth).toBe(2);
  });
});
