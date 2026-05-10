import { Stack } from 'expo-router';

export default function ResearchStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Research' }} />
      <Stack.Screen name="judgments" options={{ title: 'Judgments' }} />
      <Stack.Screen name="[judgmentId]" options={{ title: 'Judgment' }} />
      <Stack.Screen name="library" options={{ title: 'Law library' }} />
      <Stack.Screen name="mapper" options={{ title: 'Crosswalk' }} />
      <Stack.Screen name="drafting" options={{ title: 'Drafting' }} />
    </Stack>
  );
}
