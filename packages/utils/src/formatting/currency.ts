const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatInr(amount: number): string {
  if (!Number.isFinite(amount)) return '₹0';
  return INR_FORMATTER.format(amount);
}

