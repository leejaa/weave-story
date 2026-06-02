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
 * Award credits for a delivered purchase, then finish the StoreKit transaction.
 *
 * Order matters: credits are granted on the server FIRST (idempotent via the
 * `purchase_grants` table), and only then is the transaction finished. If the
 * grant fails the transaction is left unfinished so StoreKit re-delivers it on
 * the next launch and we can retry.
 */
export async function grantPurchase(purchase: Purchase, deps: GrantDeps): Promise<void> {
  const { productId, transactionId } = purchase;
  if (!transactionId) throw new Error('Missing transactionId');

  await postGrantCredits({ productId, transactionId });
  await deps.finishTransaction({ purchase, isConsumable: true });
  await deps.onGranted();
}
