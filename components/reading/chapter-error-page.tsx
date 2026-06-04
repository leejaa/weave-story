import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePalette } from '@/hooks/use-palette';
import { FONTS, SIZES } from '@/constants/colors';

type Props = {
  onRetry: () => void;
  onBack: () => void;
  retrying: boolean;
};

export function ChapterErrorPage({ onRetry, onBack, retrying }: Props) {
  const c = usePalette();
  const { t } = useTranslation(['reading', 'common']);

  return (
    <View style={[styles.container, { backgroundColor: c.paper }]}>
      <View style={styles.content}>
        <Text style={[styles.mark, { color: c.inkFaint, fontFamily: FONTS.mono }]}>· · ·</Text>
        <Text style={[styles.title, { color: c.ink, fontFamily: FONTS.display }]}>
          {t('chapterError.title')}
        </Text>
        <Text style={[styles.body, { color: c.inkSoft, fontFamily: FONTS.sans }]}>
          {t('chapterError.body')}
        </Text>

        <Pressable
          style={[styles.primaryBtn, { backgroundColor: c.thread }, retrying && styles.btnDisabled]}
          onPress={onRetry}
          disabled={retrying}>
          {retrying
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={[styles.primaryText, { fontFamily: FONTS.sansSemibold }]}>{t('common:actions.retry')}</Text>}
        </Pressable>

        <Pressable style={styles.secondaryBtn} onPress={onBack} disabled={retrying}>
          <Text style={[styles.secondaryText, { color: c.inkFaint, fontFamily: FONTS.sans }]}>
            {t('common:actions.back')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  content: { alignItems: 'center', maxWidth: 320 },
  mark: { fontSize: SIZES.lg, letterSpacing: 4, marginBottom: 20 },
  title: { fontSize: SIZES['2xl'], textAlign: 'center', marginBottom: 12 },
  body: { fontSize: SIZES.sm, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  primaryBtn: {
    minWidth: 200,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  primaryText: { color: '#fff', fontSize: SIZES.sm },
  secondaryBtn: { marginTop: 14, paddingVertical: 10, paddingHorizontal: 16 },
  secondaryText: { fontSize: SIZES.sm },
});
