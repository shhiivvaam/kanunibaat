import { Redirect, Stack } from 'expo-router';

export default function MarketingLegalQaIndex() {
  return (
    <>
      <Stack.Screen options={{ title: 'Legal Q&A' }} />
      <Redirect href="/legal-qa" />
    </>
  );
}
