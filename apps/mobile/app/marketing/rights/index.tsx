import { Redirect, Stack } from 'expo-router';

export default function MarketingRightsIndexRedirect() {
  return (
    <>
      <Stack.Screen options={{ title: 'Rights' }} />
      <Redirect href="/rights" />
    </>
  );
}
