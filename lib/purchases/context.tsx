import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useIAP } from 'expo-iap';
import type { Product, Purchase, PurchaseError } from 'expo-iap';
import * as Sentry from '@sentry/react-native';
import { PRODUCT_IDS } from './config';

type PendingPurchase = {
  resolve: (purchase: Purchase) => void;
  reject: (error: PurchaseError | Error) => void;
};

type PurchasesContextValue = {
  products: Product[];
  isLoading: boolean;
  connected: boolean;
  purchaseProduct: (sku: string) => Promise<Purchase>;
  finishTransaction: (purchase: Purchase) => Promise<void>;
  restorePurchases: () => Promise<void>;
};

const PurchasesContext = createContext<PurchasesContextValue | null>(null);

const CREDIT_SKUS = Object.values(PRODUCT_IDS);

export function PurchasesProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const pendingRef = useRef<PendingPurchase | null>(null);

  const {
    connected,
    products,
    fetchProducts,
    requestPurchase,
    finishTransaction: iapFinishTransaction,
    restorePurchases: iapRestorePurchases,
  } = useIAP({
    onPurchaseSuccess: (purchase) => {
      Sentry.addBreadcrumb({ category: 'iap', message: `onPurchaseSuccess productId=${purchase.productId} transactionId=${purchase.transactionId}` });
      pendingRef.current?.resolve(purchase);
      pendingRef.current = null;
    },
    onPurchaseError: (error) => {
      Sentry.addBreadcrumb({ category: 'iap', message: `onPurchaseError code=${error.code} message=${error.message}` });
      pendingRef.current?.reject(error);
      pendingRef.current = null;
    },
    onError: (error) => {
      Sentry.captureException(error, { tags: { context: 'iap_hook_error' } });
      console.warn('[iap] onError', error);
    },
  });

  useEffect(() => {
    Sentry.captureMessage(`[iap] connected=${connected}`, 'info');
    if (!connected) return;
    setIsLoading(true);
    fetchProducts({ skus: CREDIT_SKUS, type: 'inapp' })
      .then(() => {
        Sentry.captureMessage('[iap] fetchProducts resolved', 'info');
      })
      .catch((err: unknown) => {
        Sentry.captureException(err, { tags: { context: 'iap_fetch_products' } });
        console.warn('[iap] fetchProducts error', err);
      })
      .finally(() => setIsLoading(false));
  }, [connected]);

  useEffect(() => {
    Sentry.captureMessage(`[iap] products count=${products.length} ids=${products.map(p => p.id).join(',') || 'none'}`, 'info');
  }, [products]);

  const purchaseProduct = useCallback((sku: string): Promise<Purchase> => {
    return new Promise((resolve, reject) => {
      pendingRef.current = { resolve, reject };
      requestPurchase({
        type: 'in-app',
        request: { apple: { sku } },
      }).catch((err: unknown) => {
        pendingRef.current = null;
        reject(err instanceof Error ? err : new Error(String(err)));
      });
    });
  }, [requestPurchase]);

  const finishTransaction = useCallback(async (purchase: Purchase) => {
    await iapFinishTransaction({ purchase, isConsumable: true });
  }, [iapFinishTransaction]);

  const restorePurchases = useCallback(async () => {
    await iapRestorePurchases();
  }, [iapRestorePurchases]);

  return (
    <PurchasesContext.Provider value={{ products, isLoading, connected, purchaseProduct, finishTransaction, restorePurchases }}>
      {children}
    </PurchasesContext.Provider>
  );
}

export function usePurchases(): PurchasesContextValue {
  const ctx = useContext(PurchasesContext);
  if (!ctx) throw new Error('usePurchases must be used within PurchasesProvider');
  return ctx;
}
