import { Redirect, Stack } from 'expo-router';

export default function MarketingCaseTrackerRedirect() {
  return (
    <>
      <Stack.Screen options={{ title: 'Case Tracker' }} />
      <Redirect href="/case-tracker" />
    </>
  );
}
