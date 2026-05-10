function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function ensureWebPushSubscription(): Promise<{
  endpoint: string;
  p256dh: string;
  auth: string;
}> {
  if (!('serviceWorker' in navigator)) throw new Error('Service worker not supported.');
  if (!('PushManager' in window)) throw new Error('Push not supported.');

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) throw new Error('Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY.');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notifications permission not granted.');

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
    }));

  const json = sub.toJSON();
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!json.endpoint || !p256dh || !auth) {
    throw new Error('Invalid push subscription.');
  }
  return { endpoint: json.endpoint, p256dh, auth };
}
