import { computeReminderTimes, HEARING_REMINDER_OFFSETS_MS } from '@kb/trpc';

describe('Phase 11 notification scheduling', () => {
  it('skips reminder times in the past', () => {
    const at = new Date('2026-01-10T10:00:00.000Z');
    const now = new Date('2026-01-08T12:00:00.000Z'); // 3-day reminder is already past
    const times = computeReminderTimes({
      at,
      now,
      offsetsMs: HEARING_REMINDER_OFFSETS_MS,
    });
    // 3-day reminder is past; 1-day and 1-hour are still upcoming.
    expect(times.length).toBe(2);
  });
});
