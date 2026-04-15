import type { UrgencyTier } from '@kb/emergency-guide';

export function urgencyBadgeClass(tier: UrgencyTier): string {
  if (tier === 'urgent') return 'bg-red-100 text-red-900 ring-red-200';
  if (tier === 'serious') return 'bg-amber-100 text-amber-950 ring-amber-200';
  return 'bg-sky-100 text-sky-950 ring-sky-200';
}

export function urgencyLabel(tier: UrgencyTier): string {
  if (tier === 'urgent') return 'Urgent';
  if (tier === 'serious') return 'Serious';
  return 'Informational';
}
