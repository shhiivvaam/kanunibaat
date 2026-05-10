import '@/lib/crypto-polyfill';

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { TrpcProvider } from '@/components/TrpcProvider';
import { useColorScheme } from '@/components/useColorScheme';
import { PushNotificationsClient } from '@/components/PushNotificationsClient';
import { I18nProvider, mobileLocales, type MobileLocale } from '@/src/i18n';
import * as Sentry from '@sentry/react-native';

const mobileDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
if (mobileDsn) {
  Sentry.init({
    dsn: mobileDsn,
    enableLogs: true,
    sendDefaultPii: false,
  });
}

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default Sentry.wrap(function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
});

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const [initialLocale, setInitialLocale] = useState<MobileLocale | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync('kb.locale');
        const next =
          stored && (mobileLocales as readonly string[]).includes(stored)
            ? (stored as MobileLocale)
            : null;
        if (!cancelled) setInitialLocale(next);
      } catch {
        if (!cancelled) setInitialLocale(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <TrpcProvider>
      <I18nProvider initialLocale={initialLocale ?? undefined}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <PushNotificationsClient />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
            <Stack.Screen name="admin" options={{ title: 'Admin' }} />
            <Stack.Screen name="lawyer/onboarding" options={{ title: 'Lawyer onboarding' }} />
            <Stack.Screen name="integrations" options={{ headerShown: false }} />
            <Stack.Screen name="marketing" options={{ headerShown: false }} />
          </Stack>
        </ThemeProvider>
      </I18nProvider>
    </TrpcProvider>
  );
}
