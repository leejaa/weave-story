import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { palette, FONTS } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Props = { storeUrl: string | null; onDismiss: () => void };

/** 권장 업데이트 — 닫기 가능한 하단 카드. 'Later'는 이번 버전 스누즈. */
export function UpdatePrompt({ storeUrl, onDismiss }: Props) {
  const { t } = useTranslation('common');
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const c = palette[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: c.paperRaised, paddingBottom: insets.bottom + 20 }]}>
          <Text style={[styles.title, { color: c.ink }]}>{t('update.recommendedTitle')}</Text>
          <Text style={[styles.body, { color: c.inkSoft }]}>{t('update.recommendedBody')}</Text>
          <Pressable
            accessibilityRole="button"
            disabled={!storeUrl}
            onPress={() => storeUrl && Linking.openURL(storeUrl)}
            style={({ pressed }) => [styles.btn, { backgroundColor: c.thread, opacity: pressed ? 0.85 : 1 }]}>
            <Text style={[styles.btnText, { color: c.paper }]}>{t('update.updateButton')}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onDismiss} style={styles.later}>
            <Text style={[styles.laterText, { color: c.inkFaint }]}>{t('update.later')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  card: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 28, paddingTop: 28, gap: 12 },
  title: { fontFamily: FONTS.serifSemibold, fontSize: 20, textAlign: 'center' },
  body: { fontFamily: FONTS.sans, fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 8 },
  btn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontFamily: FONTS.sansSemibold, fontSize: 16 },
  later: { height: 44, alignItems: 'center', justifyContent: 'center' },
  laterText: { fontFamily: FONTS.sansMedium, fontSize: 14 },
});
