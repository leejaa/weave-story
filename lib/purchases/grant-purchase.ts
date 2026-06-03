import { Platform } from 'react-native';
import type { Purchase } from 'expo-iap';
import { postGrantCredits } from '@/lib/api/fetch';
import { CREDITS_PER_PRODUCT } from './config';

export function isCreditProduct(productId: string): boolean {
  return CREDITS_PER_PRODUCT[productId] != null;
}

export type GrantDeps = {
  finishTransaction: (args: { purchase: Purchase; isConsumable: boolean }) => Promise<unknown>;
  onGranted: () => void | Promise<void>;
};

/**
 * Award credits for a delivered purchase, then finish the transaction.
 *
 * Order matters: credits are granted on the server FIRST (idempotent via the
 * `purchase_grants` table), and only then is the transaction finished. If the
 * grant fails the transaction is left unfinished so the store re-delivers it on
 * the next launch and we can retry.
 *
 * The server verifies the purchase per-platform: Apple uses the `transactionId`
 * (App Store Server API), Google Play uses the `purchaseToken` (Play Developer
 * API). We send both plus the platform so the worker picks the right path.
 */
export async function grantPurchase(purchase: Purchase, deps: GrantDeps): Promise<void> {
  const { productId, transactionId } = purchase;
  const platform = Platform.OS === 'android' ? 'android' : 'ios';
  const purchaseToken = purchase.purchaseToken ?? undefined;

  if (platform === 'android' ? !purchaseToken : !transactionId) {
    throw new Error(platform === 'android' ? 'Missing purchaseToken' : 'Missing transactionId');
  }

  await postGrantCredits({ productId, transactionId: transactionId ?? '', purchaseToken, platform });
  await deps.finishTransaction({ purchase, isConsumable: true });
  await deps.onGranted();
}
