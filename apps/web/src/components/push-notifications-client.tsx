'use client';

import { useEffect } from 'react';

export function PushNotificationsClient() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    void navigator.serviceWorker.register('/sw.js');
  }, []);

  return null;
}
