import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { palette, FONTS } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';

/** 차단형 전체화면 — minSupported 미만일 때 본편 대신 렌더. 닫을 수 없다. */
export function ForceUpdateScreen({ storeUrl }: { storeUrl: string | null }) {
  const { t } = useTranslation('common');
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const c = palette[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View style={[styles.root, { backgroundColor: c.paper, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.center}>
        <Text style={[styles.mark, { color: c.thread }]}>✦</Text>
        <Text style={[styles.title, { color: c.ink }]}>{t('update.forceTitle')}</Text>
        <Text style={[styles.body, { color: c.inkSoft }]}>{t('update.forceBody')}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={!storeUrl}
        onPress={() => storeUrl && Linking.openURL(storeUrl)}
        style={({ pressed }) => [styles.btn, { backgroundColor: c.thread, opacity: pressed || !storeUrl ? 0.85 : 1, marginBottom: insets.bottom + 24 }]}>
        <Text style={[styles.btnText, { color: c.paper }]}>{t('update.updateButton')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 32, justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  mark: { fontSize: 40, marginBottom: 8 },
  title: { fontFamily: FONTS.serifSemibold, fontSize: 26, textAlign: 'center' },
  body: { fontFamily: FONTS.sans, fontSize: 15, lineHeight: 23, textAlign: 'center', maxWidth: 320 },
  btn: { height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontFamily: FONTS.sansSemibold, fontSize: 16 },
});
