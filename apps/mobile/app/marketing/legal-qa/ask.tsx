import { Redirect, Stack } from 'expo-router';

export default function MarketingLegalQaAsk() {
  return (
    <>
      <Stack.Screen options={{ title: 'Ask' }} />
      <Redirect href="/legal-qa/ask" />
    </>
  );
}
