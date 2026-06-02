import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation, Trans } from 'react-i18next';
import { usePurchases } from '@/lib/purchases/context';
import { CREDITS_PER_PRODUCT, PRODUCT_IDS } from '@/lib/purchases/config';
import { usePalette } from '@/hooks/use-palette';
import { FONTS, SIZES } from '@/constants/colors';
import { privacyUrl, termsUrl } from '@/lib/legal';
import { ErrorCode } from 'expo-iap';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function PaywallModal({ visible, onClose, onSuccess }: Props) {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('purchases');
  const { height: screenHeight } = useWindowDimensions();
  const { products, isLoading, purchaseProduct, restorePurchases } = usePurchases();
  const [loading, setLoading] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const creditProducts = products.filter(p => CREDITS_PER_PRODUCT[p.id] != null);

  const handlePurchase = useCallback(async (productId: string) => {
    setLoading(productId);
    try {
      // The provider grants credits and finishes the transaction on delivery.
      await purchaseProduct(productId);
      onSuccess();
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === ErrorCode.UserCancelled) return;
      console.error('[paywall] purchase error', err);
      Alert.alert(t('purchaseErrorTitle'), t('purchaseError'));
    } finally {
      setLoading(null);
    }
  }, [purchaseProduct, onSuccess, t]);

  const handleRestore = useCallback(async () => {
    setRestoring(true);
    try {
      await restorePurchases();
      Alert.alert(t('restoreDoneTitle'), t('restoreDone'));
    } catch (err) {
      console.error('[paywall] restore error', err);
      Alert.alert(t('restoreErrorTitle'), t('restoreError'));
    } finally {
      setRestoring(false);
    }
  }, [restorePurchases, t]);

  const sheetStyle = [
    styles.sheet,
    { maxHeight: screenHeight * 0.6, backgroundColor: c.paper, paddingBottom: insets.bottom + 16 },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={sheetStyle}>
        <View style={[styles.handle, { backgroundColor: c.rule }]} />
        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Text style={[styles.closeText, { color: c.inkFaint, fontFamily: FONTS.sans }]}>✕</Text>
        </Pressable>
        <View style={styles.content}>
          <Text style={[styles.title, { color: c.ink, fontFamily: FONTS.display }]}>
            {t('title')}
          </Text>
          <Text style={[styles.subtitle, { color: c.inkFaint, fontFamily: FONTS.sans }]}>
            {t('subtitle')}
          </Text>
          <View style={styles.options}>
            {isLoading ? (
              <ActivityIndicator color={c.thread} style={styles.loadingIndicator} />
            ) : creditProducts.length === 0 ? (
              <Text style={[styles.emptyText, { color: c.inkFaint, fontFamily: FONTS.sans }]}>
                {t('empty')}
              </Text>
            ) : creditProducts.map(product => {
              const credits = CREDITS_PER_PRODUCT[product.id] ?? 0;
              const isPopular = product.id === PRODUCT_IDS.creditsValue;
              const isThisLoading = loading === product.id;
              return (
                <View
                  key={product.id}
                  style={[styles.row, { borderColor: isPopular ? c.thread : c.rule }]}>
                  <View style={styles.rowLeft}>
                    {isPopular ? (
                      <Text style={[styles.badge, { color: c.thread, fontFamily: FONTS.sansMedium }]}>
                        {t('popular')}
                      </Text>
                    ) : null}
                    <Text style={[styles.creditLabel, { color: c.ink, fontFamily: FONTS.serifSemibold }]}>
                      {t('creditsLabel', { count: credits })}
                    </Text>
                    <Text style={[styles.priceLabel, { color: c.inkFaint, fontFamily: FONTS.sans }]}>
                      {product.displayPrice}
                    </Text>
                  </View>
                  <Pressable
                    style={[styles.buyBtn, { backgroundColor: c.thread }, isThisLoading && styles.buyBtnDisabled]}
                    onPress={() => handlePurchase(product.id)}
                    disabled={!!loading}>
                    {isThisLoading
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={[styles.buyBtnText, { fontFamily: FONTS.sansSemibold }]}>{t('buy')}</Text>}
                  </Pressable>
                </View>
              );
            })}
          </View>

          <Pressable onPress={handleRestore} disabled={restoring} style={styles.restoreBtn} hitSlop={6}>
            {restoring
              ? <ActivityIndicator color={c.inkFaint} size="small" />
              : <Text style={[styles.restoreText, { color: c.inkSoft, fontFamily: FONTS.sans }]}>{t('restore')}</Text>}
          </Pressable>

          <Text style={[styles.legal, { color: c.inkFaint, fontFamily: FONTS.sans }]}>
            <Trans
              ns="purchases"
              i18nKey="legalConsent"
              components={{
                terms: <Text style={styles.legalLink} onPress={() => Linking.openURL(termsUrl())} />,
                privacy: <Text style={styles.legalLink} onPress={() => Linking.openURL(privacyUrl())} />,
              }}
            />
          </Text>
        </View>
      </View>
    </Modal>
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
  loadingIndicator: { paddingVertical: 20 },
  emptyText: { fontSize: SIZES.sm, textAlign: 'center', paddingVertical: 16, lineHeight: 20 },
  restoreBtn: { alignSelf: 'center', paddingVertical: 12, marginTop: 4 },
  restoreText: { fontSize: SIZES.sm, textDecorationLine: 'underline' },
  legal: { fontSize: SIZES.xs, textAlign: 'center', lineHeight: 18, marginTop: 2, paddingHorizontal: 8 },
  legalLink: { textDecorationLine: 'underline' },
});
