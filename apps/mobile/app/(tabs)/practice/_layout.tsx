import { Stack } from 'expo-router';

export default function PracticeStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Practice' }} />
      <Stack.Screen name="clients" options={{ title: 'Clients' }} />
      <Stack.Screen name="cases" options={{ title: 'Cases' }} />
      <Stack.Screen name="new-case" options={{ title: 'New case' }} />
      <Stack.Screen name="[caseId]" options={{ title: 'Case' }} />
    </Stack>
  );
}
