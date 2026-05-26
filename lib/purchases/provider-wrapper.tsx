import React from 'react';
import { PurchasesProvider } from './context';

export function PurchasesProviderWrapper({ children }: { children: React.ReactNode }) {
  return <PurchasesProvider>{children}</PurchasesProvider>;
}
