import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { type Href, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { trpc } from '@jurisly/api-client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function registerForPushAsync(): Promise<string | null> {
  const perm = await Notifications.getPermissionsAsync();
  const status =
    perm.status === 'granted'
      ? perm.status
      : (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

export function PushNotificationsClient() {
  const router = useRouter();
  const didRegister = useRef(false);
  const register = trpc.notifications.registerExpoToken.useMutation();

  useEffect(() => {
    if (didRegister.current) return;
    didRegister.current = true;

    void (async () => {
      const token = await registerForPushAsync();
      if (!token) return;
      await register.mutateAsync({ token, deviceLabel: 'mobile' });
    })();
  }, [register]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as
        | Record<string, unknown>
        | undefined;
      const mobilePath = typeof data?.mobilePath === 'string' ? data.mobilePath : undefined;
      const url = typeof data?.url === 'string' ? data.url : undefined;
      const path =
        mobilePath ??
        (url?.startsWith('/app/') ? url.replace('/app', '') : url) ??
        (typeof data?.consultationId === 'string' ? `/consultations/${data.consultationId}` : null);
      if (path) {
        const normalized = path.startsWith('/') ? path : `/${path}`;
        router.push(normalized as Href);
      }
    });
    return () => sub.remove();
  }, [router]);

  return null;
}
