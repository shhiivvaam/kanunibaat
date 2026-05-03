import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { trpc } from '@jurisly/api-client';

import { absoluteWebAppHref } from '@/lib/web-app-url';

import { mobileLocales, type MobileLocale, useLocale, useSetLocale } from '@/src/i18n';

const LOCALE_LABEL: Record<MobileLocale, string> = {
  en: 'English',
  hi: 'हिन्दी',
  ta: 'தமிழ்',
  te: 'తెలుగు',
  kn: 'ಕನ್ನಡ',
  mr: 'मराठी',
  gu: 'ગુજરાતી',
  bn: 'বাংলা',
};

const NATIVE_ROUTES = [
  { label: 'Notifications', path: '/notifications' as const, note: '' },
  { label: 'Lawyer onboarding', path: '/lawyer/onboarding' as const, note: '' },
  { label: 'Integrations', path: '/integrations' as const, note: '' },
  {
    label: 'Admin — lawyer verification',
    path: '/admin' as const,
    note: 'Requires admin role',
  },
] as const;

const MARKETING_PATH = '/marketing' as const;

export default function SettingsScreen() {
  const locale = useLocale();
  const setLocale = useSetLocale();
  const update = trpc.profile.update.useMutation();
  const router = useRouter();

  function openWebMarketingRoot() {
    const path = `/${locale}`;
    void WebBrowser.openBrowserAsync(absoluteWebAppHref(path));
  }

  async function onPick(next: MobileLocale) {
    setLocale(next);
    try {
      await SecureStore.setItemAsync('kb.locale', next);
    } catch {
      // non-fatal
    }
    try {
      await update.mutateAsync({ locale: next });
    } catch {
      // anonymous: local-only
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Settings</Text>
      <View
        style={{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E7E5E4', gap: 10 }}
      >
        <Text style={{ fontSize: 16, fontWeight: '600' }}>Language</Text>
        <View style={{ gap: 8 }}>
          {mobileLocales.map((l) => {
            const active = l === locale;
            return (
              <TouchableOpacity
                key={l}
                onPress={() => void onPick(l)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: active ? '#C2410C' : '#E7E5E4',
                  backgroundColor: active ? '#FFF7ED' : 'white',
                }}
              >
                <Text
                  style={{ fontSize: 14, fontWeight: active ? '700' : '500', color: '#1C1917' }}
                >
                  {LOCALE_LABEL[l]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View
        style={{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E7E5E4', gap: 10 }}
      >
        <Text style={{ fontSize: 16, fontWeight: '600' }}>Account & tools</Text>
        <Text style={{ fontSize: 13, color: '#57534E' }}>
          Notifications, onboarding, integrations, and admin verification run natively — same APIs
          as web. Set <Text style={{ fontWeight: '600' }}>EXPO_PUBLIC_APP_URL</Text> so DigiLocker
          OAuth returns to your site callback.
        </Text>
        <View style={{ gap: 8 }}>
          {NATIVE_ROUTES.map((row) => (
            <TouchableOpacity
              key={row.path}
              onPress={() => router.push(row.path)}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#E7E5E4',
                backgroundColor: 'white',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#1C1917' }}>{row.label}</Text>
              {row.note ? (
                <Text style={{ fontSize: 12, color: '#78716C', marginTop: 4 }}>{row.note}</Text>
              ) : null}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => router.push(MARKETING_PATH)}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: '#EA580C',
              backgroundColor: '#FFF7ED',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#C2410C' }}>
              Marketing & public pages
            </Text>
            <Text style={{ fontSize: 12, color: '#78716C', marginTop: 4 }}>
              Landing, pricing, policies, vault share links — native mirror of web marketing routes.
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity onPress={() => openWebMarketingRoot()} style={{ paddingVertical: 12 }}>
        <Text
          style={{
            fontSize: 13,
            color: '#C2410C',
            fontWeight: '600',
            textDecorationLine: 'underline',
          }}
        >
          Open canonical web site ({locale}) in browser
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
