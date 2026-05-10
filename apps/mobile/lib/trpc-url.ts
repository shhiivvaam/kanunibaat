import Constants from 'expo-constants';
import { Platform } from 'react-native';

export function trpcPlatformApiBase(): string {
  const fromEnv =
    (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '')) ||
    (Constants.expoConfig?.extra?.apiUrl as string | undefined)?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  return Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
}
