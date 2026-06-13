import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePalette } from '@/hooks/use-palette';
import { FONTS, SIZES } from '@/constants/colors';

/** 모더레이션으로 숨김 처리된 챕터에 표시되는 안내 페이지. */
export function HiddenPage() {
  const c = usePalette();
  const { t } = useTranslation('reading');

  return (
    <View style={[styles.container, { backgroundColor: c.paper }]}>
      <View style={styles.content}>
        <Text style={[styles.mark, { color: c.inkFaint, fontFamily: FONTS.mono }]}>· · ·</Text>
        <Text style={[styles.title, { color: c.ink, fontFamily: FONTS.display }]}>
          {t('hidden.title')}
        </Text>
        <Text style={[styles.body, { color: c.inkSoft, fontFamily: FONTS.sans }]}>
          {t('hidden.body')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  content: { alignItems: 'center', maxWidth: 320 },
  mark: { fontSize: SIZES.lg, letterSpacing: 4, marginBottom: 20 },
  title: { fontSize: SIZES['2xl'], textAlign: 'center', marginBottom: 12 },
  body: { fontSize: SIZES.sm, textAlign: 'center', lineHeight: 22 },
});
