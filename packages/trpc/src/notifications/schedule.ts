export const HEARING_REMINDER_OFFSETS_MS = [
  3 * 24 * 60 * 60 * 1000, // 3 days
  1 * 24 * 60 * 60 * 1000, // 1 day
  1 * 60 * 60 * 1000, // 1 hour
] as const;

export function computeReminderTimes(opts: {
  at: Date;
  now?: Date;
  offsetsMs?: readonly number[];
}): Date[] {
  const now = opts.now ?? new Date();
  const offsets = opts.offsetsMs ?? HEARING_REMINDER_OFFSETS_MS;
  const out: Date[] = [];
  for (const off of offsets) {
    const t = new Date(opts.at.getTime() - off);
    if (t.getTime() > now.getTime()) out.push(t);
  }
  return out;
}

