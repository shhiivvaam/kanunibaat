import { Stack } from 'expo-router';

export default function VaultStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Vault' }} />
      <Stack.Screen name="upload" options={{ title: 'Upload' }} />
      <Stack.Screen name="[documentId]" options={{ title: 'Document' }} />
    </Stack>
  );
}
