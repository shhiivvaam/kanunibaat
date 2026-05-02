import { Redirect, Stack, useLocalSearchParams } from 'expo-router';

export default function MarketingKyaKareinSlug() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  if (!slug || typeof slug !== 'string') {
    return (
      <>
        <Stack.Screen options={{ title: 'Kya Karein?' }} />
        <Redirect href="/marketing/kya-karein" />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: slug }} />
      <Redirect href={{ pathname: '/guide/[slug]', params: { slug } }} />
    </>
  );
}
