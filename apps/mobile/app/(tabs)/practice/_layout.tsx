import { Stack } from 'expo-router';

export default function PracticeStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Practice' }} />
      <Stack.Screen name="clients" options={{ title: 'Clients' }} />
      <Stack.Screen name="cases" options={{ title: 'Cases' }} />
      <Stack.Screen name="new-case" options={{ title: 'New case' }} />
      <Stack.Screen name="analytics" options={{ title: 'Analytics' }} />
      <Stack.Screen name="invoices" options={{ title: 'Invoices' }} />
      <Stack.Screen name="invoice/[id]" options={{ title: 'Invoice' }} />
      <Stack.Screen name="billing-settings" options={{ title: 'GST & firm' }} />
      <Stack.Screen name="[caseId]" options={{ title: 'Case' }} />
    </Stack>
  );
}
