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
import { usePurchases } from '@/lib/purchases/context';
import { CREDITS_PER_PRODUCT, PRODUCT_IDS } from '@/lib/purchases/config';
import { usePalette } from '@/hooks/use-palette';
import { FONTS, SIZES } from '@/constants/colors';
import { ErrorCode } from 'expo-iap';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function PaywallModal({ visible, onClose, onSuccess }: Props) {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const { products, isLoading, purchaseProduct } = usePurchases();
  const [loading, setLoading] = useState<string | null>(null);

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
      Alert.alert('구매 오류', '구매 중 문제가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(null);
    }
  }, [purchaseProduct, onSuccess]);

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
            크레딧 충전
          </Text>
          <Text style={[styles.subtitle, { color: c.inkFaint, fontFamily: FONTS.sans }]}>
            크레딧으로 새 이야기를 시작하거나 다음 챕터를 열어보세요.
          </Text>
          <View style={styles.options}>
            {isLoading ? (
              <ActivityIndicator color={c.thread} style={styles.loadingIndicator} />
            ) : creditProducts.length === 0 ? (
              <Text style={[styles.emptyText, { color: c.inkFaint, fontFamily: FONTS.sans }]}>
                상품을 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.
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
                        인기
                      </Text>
                    ) : null}
                    <Text style={[styles.creditLabel, { color: c.ink, fontFamily: FONTS.serifSemibold }]}>
                      {credits}크레딧
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
                      : <Text style={[styles.buyBtnText, { fontFamily: FONTS.sansSemibold }]}>구매하기</Text>}
                  </Pressable>
                </View>
              );
            })}
          </View>
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
});
