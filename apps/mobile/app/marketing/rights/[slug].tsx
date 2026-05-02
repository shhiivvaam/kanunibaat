import { Redirect, Stack, useLocalSearchParams } from 'expo-router';

export default function MarketingRightsSlugRedirect() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  if (!slug || typeof slug !== 'string') {
    return (
      <>
        <Stack.Screen options={{ title: 'Rights' }} />
        <Redirect href="/marketing/rights" />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: slug }} />
      <Redirect href={{ pathname: '/rights/[slug]', params: { slug } }} />
    </>
  );
}
