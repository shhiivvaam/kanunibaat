import { Redirect, Stack } from 'expo-router';

export default function MarketingLawyersIndex() {
  return (
    <>
      <Stack.Screen options={{ title: 'Lawyers' }} />
      <Redirect href="/lawyers" />
    </>
  );
}
