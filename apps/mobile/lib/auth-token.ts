import * as SecureStore from 'expo-secure-store';
import { DeviceEventEmitter } from 'react-native';

const STORAGE_KEY = 'jurisly_session_token';
const CHANGED_EVENT = 'jurisly_session_token_changed';

export async function getSessionToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function setSessionToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  });
  DeviceEventEmitter.emit(CHANGED_EVENT);
}

export async function clearSessionToken(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEY);
  DeviceEventEmitter.emit(CHANGED_EVENT);
}

export function subscribeSessionTokenChanged(listener: () => void): () => void {
  const sub = DeviceEventEmitter.addListener(CHANGED_EVENT, listener);
  return () => sub.remove();
}
