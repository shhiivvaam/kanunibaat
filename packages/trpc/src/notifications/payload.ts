export interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
  data?: Record<string, unknown>;
}

export function makeDedupeKey(parts: (string | number)[]): string {
  return parts.join(':');
}
