import { Redirect, Stack } from 'expo-router';

export default function MarketingNoticeScannerIndex() {
  return (
    <>
      <Stack.Screen options={{ title: 'Notice Scanner' }} />
      <Redirect href="/notice-scanner" />
    </>
  );
}
