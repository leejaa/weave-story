import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePurchases } from '@/lib/purchases/context';
import { CREDITS_PER_PRODUCT, PRODUCT_IDS } from '@/lib/purchases/config';
import { postGrantCredits } from '@/lib/api/fetch';
import { useQueryClient } from '@tanstack/react-query';
import { usePalette } from '@/hooks/use-palette';
import { FONTS } from '@/constants/colors';
import type { PurchasesPackage, PurchasesStoreProduct, PurchasesStoreTransaction } from 'react-native-purchases';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function PaywallModal({ visible, onClose, onSuccess }: Props) {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const { offerings, purchasePackage, restorePurchases } = usePurchases();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState<string | null>(null);

  const packages = offerings?.current?.availablePackages ?? [];

  const handlePurchase = useCallback(async (pkg: PurchasesPackage & { product: PurchasesStoreProduct }) => {
    setLoading(pkg.product.identifier);
    try {
      const customerInfo = await purchasePackage(pkg);

      const productId = pkg.product.identifier;
      const credits = CREDITS_PER_PRODUCT[productId];

      if (credits) {
        const nonSubs: PurchasesStoreTransaction[] = customerInfo.nonSubscriptionTransactions ?? [];
        const latest = nonSubs
          .filter(t => t.productIdentifier === productId)
          .sort((a, b) => b.purchaseDateMillis - a.purchaseDateMillis)[0];

        const purchaseDateMs = latest
          ? String(latest.purchaseDateMillis)
          : String(Date.now());

        await postGrantCredits({ productId, purchaseDateMs });
        await queryClient.invalidateQueries({ queryKey: ['me'] });
      } else {
        await queryClient.invalidateQueries({ queryKey: ['me'] });
      }

      onSuccess();
    } catch (err) {
      if (err instanceof Error && (err as Error & { userCancelled?: boolean }).userCancelled) return;
      console.error('[paywall] purchase error', err);
    } finally {
      setLoading(null);
    }
  }, [purchasePackage, queryClient, onSuccess]);

  const handleRestore = useCallback(async () => {
    setLoading('restore');
    try {
      await restorePurchases();
      await queryClient.invalidateQueries({ queryKey: ['me'] });
    } catch (err) {
      console.error('[paywall] restore error', err);
    } finally {
      setLoading(null);
    }
  }, [restorePurchases, queryClient]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: c.paper, paddingBottom: insets.bottom + 24 }]}>
        <View style={[styles.handle, { backgroundColor: c.rule }]} />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { color: c.ink, fontFamily: FONTS.serif }]}>
            Continue Your Story
          </Text>
          <Text style={[styles.subtitle, { color: c.inkFaint, fontFamily: FONTS.sans }]}>
            Choose a plan to keep writing
          </Text>

          {packages.map(pkg => {
            const isSubscription = pkg.product.identifier === PRODUCT_IDS.premiumMonthly;
            const credits = CREDITS_PER_PRODUCT[pkg.product.identifier];
            const isLoading = loading === pkg.product.identifier;

            return (
              <Pressable
                key={pkg.identifier}
                style={[styles.card, { borderColor: isSubscription ? c.thread : c.rule, backgroundColor: c.paper }]}
                onPress={() => handlePurchase(pkg)}
                disabled={!!loading}>
                <View style={styles.cardContent}>
                  {isSubscription && (
                    <View style={[styles.badge, { backgroundColor: c.thread }]}>
                      <Text style={[styles.badgeText, { fontFamily: FONTS.sansMedium }]}>BEST VALUE</Text>
                    </View>
                  )}
                  <Text style={[styles.productName, { color: c.ink, fontFamily: FONTS.sansSemibold }]}>
                    {pkg.product.title || (isSubscription ? 'Monthly Premium' : `${credits} Stories`)}
                  </Text>
                  <Text style={[styles.productDesc, { color: c.inkFaint, fontFamily: FONTS.sans }]}>
                    {isSubscription
                      ? 'Unlimited stories every month'
                      : `${credits} story credit${credits > 1 ? 's' : ''}`}
                  </Text>
                  <Text style={[styles.price, { color: c.thread, fontFamily: FONTS.serifSemibold }]}>
                    {pkg.product.priceString}
                    {isSubscription ? ' / month' : ''}
                  </Text>
                </View>
                {isLoading && <ActivityIndicator color={c.thread} />}
              </Pressable>
            );
          })}

          <Pressable style={styles.restoreBtn} onPress={handleRestore} disabled={!!loading}>
            {loading === 'restore' ? (
              <ActivityIndicator color={c.inkFaint} size="small" />
            ) : (
              <Text style={[styles.restoreText, { color: c.inkFaint, fontFamily: FONTS.sans }]}>
                Restore Purchases
              </Text>
            )}
          </Pressable>
        </ScrollView>

        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Text style={[styles.closeText, { color: c.inkFaint, fontFamily: FONTS.sans }]}>✕</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8, gap: 12 },
  title: { fontSize: 26, lineHeight: 32, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 15, textAlign: 'center', marginBottom: 8 },
  card: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardContent: { flex: 1, gap: 4 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  badgeText: { color: '#fff', fontSize: 10, letterSpacing: 0.5 },
  productName: { fontSize: 17 },
  productDesc: { fontSize: 13 },
  price: { fontSize: 20, marginTop: 4 },
  restoreBtn: { alignItems: 'center', paddingVertical: 16 },
  restoreText: { fontSize: 13 },
  closeBtn: { position: 'absolute', top: 20, right: 20, padding: 8 },
  closeText: { fontSize: 18 },
});
