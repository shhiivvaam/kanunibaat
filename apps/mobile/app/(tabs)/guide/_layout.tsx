import { Stack } from 'expo-router';

export default function GuideStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Kya Karein?' }} />
      <Stack.Screen name="[slug]" options={{ title: 'Guide' }} />
    </Stack>
  );
}
