import { Stack } from 'expo-router';

export default function LawyersStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Lawyers' }} />
      <Stack.Screen name="[slug]" options={{ title: 'Profile' }} />
    </Stack>
  );
}
