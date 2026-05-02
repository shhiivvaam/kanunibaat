import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { MarketingStaticScreen } from '@/components/marketing-static-screen';
import { getMarketingPage } from '@/lib/marketing-static-copy';

export default function MarketingPageScreen() {
  const { pageSlug } = useLocalSearchParams<{ pageSlug: string }>();
  const page = getMarketingPage(pageSlug);

  if (!page) {
    return (
      <View style={styles.fail}>
        <Stack.Screen options={{ title: 'Not found' }} />
        <Text style={styles.err}>No native marketing screen for {String(pageSlug)}.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: page.title }} />
      <MarketingStaticScreen title={page.title} paragraphs={page.paragraphs} />
    </>
  );
}

const styles = StyleSheet.create({
  fail: { flex: 1, padding: 20 },
  err: { color: '#B91C1C', fontSize: 14 },
});
