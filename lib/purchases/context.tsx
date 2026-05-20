import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
} from 'react-native-purchases';
import { RC_PUBLIC_KEY, ENTITLEMENT_PREMIUM } from './config';

type PurchasesContextValue = {
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOfferings | null;
  isLoading: boolean;
  isPremium: boolean;
  purchasePackage: (pkg: PurchasesPackage) => Promise<CustomerInfo>;
  restorePurchases: () => Promise<CustomerInfo>;
};

const PurchasesContext = createContext<PurchasesContextValue | null>(null);

export function PurchasesProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: string | null;
}) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!RC_PUBLIC_KEY || !userId) {
      setIsLoading(false);
      return;
    }

    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
    Purchases.configure({ apiKey: RC_PUBLIC_KEY, appUserID: userId });

    let mounted = true;
    Promise.all([Purchases.getCustomerInfo(), Purchases.getOfferings()])
      .then(([info, offs]) => {
        if (!mounted) return;
        setCustomerInfo(info);
        setOfferings(offs);
      })
      .catch(err => console.warn('[RC] init error', err))
      .finally(() => { if (mounted) setIsLoading(false); });

    Purchases.addCustomerInfoUpdateListener((info: CustomerInfo) => {
      if (mounted) setCustomerInfo(info);
    });

    return () => { mounted = false; };
  }, [userId]);

  const purchasePackage = useCallback(async (pkg: PurchasesPackage) => {
    const { customerInfo: info } = await Purchases.purchasePackage(pkg);
    setCustomerInfo(info);
    return info;
  }, []);

  const restorePurchases = useCallback(async () => {
    const info = await Purchases.restorePurchases();
    setCustomerInfo(info);
    return info;
  }, []);

  const isPremium = !!customerInfo?.entitlements.active[ENTITLEMENT_PREMIUM];

  return (
    <PurchasesContext.Provider value={{ customerInfo, offerings, isLoading, isPremium, purchasePackage, restorePurchases }}>
      {children}
    </PurchasesContext.Provider>
  );
}

export function usePurchases(): PurchasesContextValue {
  const ctx = useContext(PurchasesContext);
  if (!ctx) throw new Error('usePurchases must be used within PurchasesProvider');
  return ctx;
}
