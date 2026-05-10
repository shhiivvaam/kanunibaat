import { Redirect, Stack, useLocalSearchParams } from 'expo-router';

export default function MarketingLawyersSlugRedirect() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  if (!slug || typeof slug !== 'string') {
    return (
      <>
        <Stack.Screen options={{ title: 'Lawyers' }} />
        <Redirect href="/marketing/lawyers" />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Lawyer' }} />
      <Redirect href={{ pathname: '/lawyers/[slug]', params: { slug } }} />
    </>
  );
}
