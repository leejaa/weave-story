import React from 'react';
import { PurchasesProvider } from './context';
import { useMe } from '@/hooks/use-me';

export function PurchasesProviderWrapper({ children }: { children: React.ReactNode }) {
  const { data: me } = useMe();
  return (
    <PurchasesProvider userId={me?.id ?? null}>
      {children}
    </PurchasesProvider>
  );
}
