import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Canonical web app origin for “open in browser” flows (must match deployed Next.js).
 * Prefer `EXPO_PUBLIC_APP_URL`; dev defaults mirror `trpc-url` host selection.
 */
export function webAppOrigin(): string {
  const fromEnv =
    (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_APP_URL?.trim()) ||
    (Constants.expoConfig?.extra?.webAppUrl as string | undefined)?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
}

/** `path` must start with `/` (e.g. `/en/app/notifications`). */
export function absoluteWebAppHref(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${webAppOrigin()}${p}`;
}
