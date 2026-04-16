import * as SecureStore from 'expo-secure-store';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { trpc } from '@kb/api-client';

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

export default function SettingsScreen() {
  const locale = useLocale();
  const setLocale = useSetLocale();
  const update = trpc.profile.update.useMutation();

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
      <View style={{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E7E5E4', gap: 10 }}>
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
                <Text style={{ fontSize: 14, fontWeight: active ? '700' : '500', color: '#1C1917' }}>
                  {LOCALE_LABEL[l]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

