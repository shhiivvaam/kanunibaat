import { Redirect, Stack } from 'expo-router';

export default function MarketingKyaKareinIndex() {
  return (
    <>
      <Stack.Screen options={{ title: 'Kya Karein?' }} />
      <Redirect href="/guide" />
    </>
  );
}
