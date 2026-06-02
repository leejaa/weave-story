import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useIAP } from 'expo-iap';
import type { Product, Purchase, PurchaseError } from 'expo-iap';
import * as Sentry from '@sentry/react-native';
import { useQueryClient } from '@tanstack/react-query';
import { PRODUCT_IDS } from './config';
import { grantPurchase, isCreditProduct } from './grant-purchase';

type PendingPurchase = {
  resolve: (purchase: Purchase) => void;
  reject: (error: PurchaseError | Error) => void;
};

type PurchasesContextValue = {
  products: Product[];
  isLoading: boolean;
  connected: boolean;
  purchaseProduct: (sku: string) => Promise<Purchase>;
  restorePurchases: () => Promise<void>;
};

const PurchasesContext = createContext<PurchasesContextValue | null>(null);

const CREDIT_SKUS = Object.values(PRODUCT_IDS);

export function PurchasesProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const pendingRef = useRef<PendingPurchase | null>(null);
  const processingRef = useRef<Set<string>>(new Set());
  // Holds the latest processPurchase so the useIAP listener (created below, before
  // processPurchase is defined) can call it without a temporal-dead-zone reference.
  const processRef = useRef<(purchase: Purchase) => Promise<void>>(async () => {});
  const queryClient = useQueryClient();

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
      void processRef.current(purchase);
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

  // Grant credits and finish the transaction for ANY delivered purchase — including
  // unfinished transactions that StoreKit re-delivers on app launch, not only ones
  // started from the paywall button. Gating this behind a pending button tap would
  // strand re-delivered transactions forever (they never get granted or finished).
  const processPurchase = useCallback(async (purchase: Purchase) => {
    const txId = purchase.transactionId;

    if (!txId || !isCreditProduct(purchase.productId)) {
      pendingRef.current?.resolve(purchase);
      pendingRef.current = null;
      return;
    }

    // Avoid double-processing the same transaction (e.g. startup delivery racing a tap).
    if (processingRef.current.has(txId)) return;
    processingRef.current.add(txId);

    try {
      await grantPurchase(purchase, {
        finishTransaction: iapFinishTransaction,
        onGranted: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
      });
      Sentry.captureMessage(`[iap] granted+finished productId=${purchase.productId} transactionId=${txId}`, 'info');
      pendingRef.current?.resolve(purchase);
      pendingRef.current = null;
    } catch (err: unknown) {
      // Leave the transaction unfinished so it retries on the next delivery.
      Sentry.captureException(err, { tags: { context: 'iap_process_purchase' } });
      console.warn('[iap] processPurchase error', err);
      pendingRef.current?.reject(err instanceof Error ? err : new Error(String(err)));
      pendingRef.current = null;
    } finally {
      processingRef.current.delete(txId);
    }
  }, [iapFinishTransaction, queryClient]);

  processRef.current = processPurchase;

  useEffect(() => {
    Sentry.captureMessage(`[iap] connected=${connected}`, 'info');
    if (!connected) return;
    setIsLoading(true);
    fetchProducts({ skus: CREDIT_SKUS, type: 'in-app' })
      .then(() => {
        Sentry.captureMessage('[iap] fetchProducts resolved', 'info');
      })
      .catch((err: unknown) => {
        Sentry.captureException(err, { tags: { context: 'iap_fetch_products' } });
        console.warn('[iap] fetchProducts error', err);
      })
      .finally(() => setIsLoading(false));
  }, [connected, fetchProducts]);

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

  const restorePurchases = useCallback(async () => {
    await iapRestorePurchases();
  }, [iapRestorePurchases]);

  return (
    <PurchasesContext.Provider value={{ products, isLoading, connected, purchaseProduct, restorePurchases }}>
      {children}
    </PurchasesContext.Provider>
  );
}

export function usePurchases(): PurchasesContextValue {
  const ctx = useContext(PurchasesContext);
  if (!ctx) throw new Error('usePurchases must be used within PurchasesProvider');
  return ctx;
}
