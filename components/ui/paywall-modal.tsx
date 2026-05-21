import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { usePurchases } from '@/lib/purchases/context';
import { CREDITS_PER_PRODUCT, ENTITLEMENT_PREMIUM, PRODUCT_IDS } from '@/lib/purchases/config';
import { postGrantCredits } from '@/lib/api/fetch';
import { useQueryClient } from '@tanstack/react-query';
import { usePalette } from '@/hooks/use-palette';
import { FONTS, SIZES } from '@/constants/colors';
import type { PurchasesPackage, PurchasesStoreTransaction } from 'react-native-purchases';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function PaywallModal({ visible, onClose, onSuccess }: Props) {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const { t } = useTranslation('common');
  const { offerings, isLoading: offeringsLoading, purchasePackage, restorePurchases } = usePurchases();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState<string | null>(null);
  const [showSubscription, setShowSubscription] = useState(false);

  const allPackages = offerings?.current?.availablePackages ?? [];
  const creditPackages = allPackages.filter(p => p.product.identifier !== PRODUCT_IDS.premiumMonthly);
  const subscriptionPackage = allPackages.find(p => p.product.identifier === PRODUCT_IDS.premiumMonthly);

  const handlePurchase = useCallback(async (pkg: PurchasesPackage) => {
    setLoading(pkg.product.identifier);
    try {
      const customerInfo = await purchasePackage(pkg);
      const productId = pkg.product.identifier;
      const credits = CREDITS_PER_PRODUCT[productId];

      if (credits) {
        const nonSubs: PurchasesStoreTransaction[] = customerInfo.nonSubscriptionTransactions ?? [];
        const latest = nonSubs
          .filter(tx => tx.productIdentifier === productId)
          .sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate))[0];
        const purchaseDateMs = latest
          ? String(new Date(latest.purchaseDate).getTime())
          : String(Date.now());
        await postGrantCredits({ productId, purchaseDateMs });
      }

      await queryClient.invalidateQueries({ queryKey: ['me'] });
      setShowSubscription(false);
      onSuccess();
    } catch (err) {
      if (err instanceof Error && (err as Error & { userCancelled?: boolean }).userCancelled) return;
      console.error('[paywall] purchase error', err);
      Alert.alert('구매 오류', '구매 중 문제가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(null);
    }
  }, [purchasePackage, queryClient, onSuccess]);

  const handleRestore = useCallback(async () => {
    setLoading('restore');
    try {
      const customerInfo = await restorePurchases();
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      if (customerInfo.entitlements.active[ENTITLEMENT_PREMIUM]) {
        setShowSubscription(false);
        onSuccess();
      } else {
        Alert.alert(t('paywall.subscription.restoreNone'));
      }
    } catch (err) {
      console.error('[paywall] restore error', err);
      Alert.alert('복원 오류', '복원 중 문제가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(null);
    }
  }, [restorePurchases, queryClient, t, onSuccess]);

  const handleClose = useCallback(() => {
    setShowSubscription(false);
    onClose();
  }, [onClose]);

  const sheetStyle = [
    styles.sheet,
    { maxHeight: screenHeight * 0.6, backgroundColor: c.paper, paddingBottom: insets.bottom + 16 },
  ];

  return (
    <>
      {/* Credits drawer */}
      <Modal
        visible={visible && !showSubscription}
        animationType="slide"
        transparent
        onRequestClose={handleClose}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={sheetStyle}>
          <View style={[styles.handle, { backgroundColor: c.rule }]} />
          <Pressable style={styles.closeBtn} onPress={handleClose}>
            <Text style={[styles.closeText, { color: c.inkFaint, fontFamily: FONTS.sans }]}>✕</Text>
          </Pressable>
          <View style={styles.content}>
            <Text style={[styles.title, { color: c.ink, fontFamily: FONTS.display }]}>
              {t('paywall.credits.title')}
            </Text>
            <Text style={[styles.subtitle, { color: c.inkFaint, fontFamily: FONTS.sans }]}>
              {t('paywall.credits.subtitle')}
            </Text>
            <View style={styles.options}>
              {offeringsLoading ? (
                <ActivityIndicator color={c.thread} style={styles.loadingIndicator} />
              ) : creditPackages.length === 0 ? (
                <Text style={[styles.emptyText, { color: c.inkFaint, fontFamily: FONTS.sans }]}>
                  상품을 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.
                </Text>
              ) : creditPackages.map(pkg => {
                const credits = CREDITS_PER_PRODUCT[pkg.product.identifier] ?? 0;
                const isPopular = pkg.product.identifier === PRODUCT_IDS.creditsValue;
                const isLoading = loading === pkg.product.identifier;
                return (
                  <View
                    key={pkg.identifier}
                    style={[styles.row, { borderColor: isPopular ? c.thread : c.rule }]}>
                    <View style={styles.rowLeft}>
                      {isPopular && (
                        <Text style={[styles.badge, { color: c.thread, fontFamily: FONTS.sansMedium }]}>
                          {t('paywall.credits.popular')}
                        </Text>
                      )}
                      <Text style={[styles.creditLabel, { color: c.ink, fontFamily: FONTS.serifSemibold }]}>
                        {t(credits === 1 ? 'paywall.credits.creditsDesc_one' : 'paywall.credits.creditsDesc_other', { count: credits })}
                      </Text>
                      <Text style={[styles.priceLabel, { color: c.inkFaint, fontFamily: FONTS.sans }]}>
                        {pkg.product.priceString}
                      </Text>
                    </View>
                    <Pressable
                      style={[styles.buyBtn, { backgroundColor: c.thread }, isLoading && styles.buyBtnDisabled]}
                      onPress={() => handlePurchase(pkg)}
                      disabled={!!loading}>
                      {isLoading
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={[styles.buyBtnText, { fontFamily: FONTS.sansSemibold }]}>구매하기</Text>}
                    </Pressable>
                  </View>
                );
              })}
            </View>
            <Pressable style={styles.secondaryLink} onPress={() => setShowSubscription(true)} disabled={!!loading}>
              <Text style={[styles.secondaryLinkText, { color: c.inkFaint, fontFamily: FONTS.sans }]}>
                {t('paywall.credits.goSubscription')}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Subscription drawer */}
      <Modal
        visible={showSubscription}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSubscription(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowSubscription(false)} />
        <View style={sheetStyle}>
          <View style={[styles.handle, { backgroundColor: c.rule }]} />
          <Pressable style={styles.closeBtn} onPress={() => setShowSubscription(false)}>
            <Text style={[styles.closeText, { color: c.inkFaint, fontFamily: FONTS.sans }]}>✕</Text>
          </Pressable>
          <View style={styles.content}>
            <Pressable style={styles.backBtn} onPress={() => setShowSubscription(false)}>
              <Text style={[styles.backText, { color: c.inkFaint, fontFamily: FONTS.sans }]}>
                {t('paywall.subscription.back')}
              </Text>
            </Pressable>
            <Text style={[styles.title, { color: c.ink, fontFamily: FONTS.display }]}>
              {t('paywall.subscription.title')}
            </Text>
            <Text style={[styles.subtitle, { color: c.inkFaint, fontFamily: FONTS.sans }]}>
              {t('paywall.subscription.subtitle')}
            </Text>
            {subscriptionPackage && (
              <View style={[styles.row, { borderColor: c.thread }]}>
                <View style={styles.rowLeft}>
                  <Text style={[styles.badge, { color: c.thread, fontFamily: FONTS.sansMedium }]}>
                    {t('paywall.subscription.badge')}
                  </Text>
                  <Text style={[styles.creditLabel, { color: c.ink, fontFamily: FONTS.serifSemibold }]}>
                    {subscriptionPackage.product.priceString}
                    <Text style={[styles.priceLabel, { color: c.inkFaint, fontFamily: FONTS.sans }]}>
                      {t('paywall.subscription.perMonth')}
                    </Text>
                  </Text>
                  <Text style={[styles.priceLabel, { color: c.inkFaint, fontFamily: FONTS.sans }]}>
                    {t('paywall.subscription.productDesc')}
                  </Text>
                </View>
                <Pressable
                  style={[
                    styles.buyBtn,
                    { backgroundColor: c.thread },
                    loading === subscriptionPackage.product.identifier && styles.buyBtnDisabled,
                  ]}
                  onPress={() => handlePurchase(subscriptionPackage)}
                  disabled={!!loading}>
                  {loading === subscriptionPackage.product.identifier
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={[styles.buyBtnText, { fontFamily: FONTS.sansSemibold }]}>구독하기</Text>}
                </Pressable>
              </View>
            )}
            <View style={styles.restoreSection}>
              <Pressable onPress={handleRestore} disabled={!!loading}>
                {loading === 'restore'
                  ? <ActivityIndicator color={c.inkFaint} size="small" />
                  : <Text style={[styles.restoreLink, { color: c.inkFaint, fontFamily: FONTS.sans }]}>
                      {t('paywall.subscription.restoreLink')}
                    </Text>}
              </Pressable>
              <Text style={[styles.restoreHint, { color: c.inkFaint, fontFamily: FONTS.sans }]}>
                {t('paywall.subscription.restoreHint')}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  closeBtn: { position: 'absolute', top: 16, right: 20, padding: 8 },
  closeText: { fontSize: SIZES.lg },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 12, gap: 8 },
  title: { fontSize: SIZES['2xl'] },
  subtitle: { fontSize: SIZES.sm, marginTop: -4 },
  options: { gap: 8 },
  row: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowLeft: { flex: 1, gap: 2 },
  badge: { fontSize: SIZES.xs, letterSpacing: 0.4, marginBottom: 1 },
  creditLabel: { fontSize: SIZES.lg },
  priceLabel: { fontSize: SIZES.sm },
  buyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 76,
  },
  buyBtnDisabled: { opacity: 0.6 },
  buyBtnText: { color: '#fff', fontSize: SIZES.sm },
  secondaryLink: { alignItems: 'center', paddingTop: 2 },
  secondaryLinkText: { fontSize: SIZES.xs },
  backBtn: { marginBottom: 0 },
  backText: { fontSize: SIZES.sm },
  restoreSection: { alignItems: 'center', gap: 4, paddingTop: 2 },
  restoreLink: { fontSize: SIZES.xs, textDecorationLine: 'underline' },
  restoreHint: { fontSize: SIZES['2xs'], textAlign: 'center', opacity: 0.7 },
  loadingIndicator: { paddingVertical: 20 },
  emptyText: { fontSize: SIZES.sm, textAlign: 'center', paddingVertical: 16, lineHeight: 20 },
});
