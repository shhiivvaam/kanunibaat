/**
 * India financial year starts 1 April. Returns the calendar year of that April
 * (e.g. 15 May 2026 → 2026; 15 Feb 2026 → 2025).
 */
export function indianFyStartYear(d: Date): number {
  const m = d.getMonth();
  const y = d.getFullYear();
  return m >= 3 ? y : y - 1;
}
