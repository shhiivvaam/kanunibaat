import { Stack } from 'expo-router';

export default function ConsultationsStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Consultations' }} />
      <Stack.Screen name="[consultationId]" options={{ title: 'Consultation' }} />
    </Stack>
  );
}
