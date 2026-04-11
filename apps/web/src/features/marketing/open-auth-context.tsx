'use client';

import { createContext, useContext } from 'react';

export type AuthTab = 'login' | 'signup';

export type OpenAuthFn = (tab?: AuthTab) => void;

const OpenAuthContext = createContext<OpenAuthFn | null>(null);

export function useOpenAuth(): OpenAuthFn {
  const fn = useContext(OpenAuthContext);
  if (!fn) {
    throw new Error('useOpenAuth must be used within the marketing layout');
  }
  return fn;
}

export function OpenAuthContextProvider({
  value,
  children,
}: {
  value: OpenAuthFn;
  children: React.ReactNode;
}) {
  return <OpenAuthContext.Provider value={value}>{children}</OpenAuthContext.Provider>;
}
