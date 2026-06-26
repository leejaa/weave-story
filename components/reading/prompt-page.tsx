import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePalette } from '@/hooks/use-palette';
import { FONTS, SIZES } from '@/constants/colors';

type Props = { prompt: string };

// 1화 앞 표지 — 이 이야기를 만든 원본 프롬프트를 먼저 보여준다.
export function PromptPage({ prompt }: Props) {
  const c = usePalette();
  const { t } = useTranslation('reading');

  return (
    <View style={styles.page}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        <Text allowFontScaling={false} style={[styles.label, { color: c.inkFaint }]}>
          {t('promptCover.label')}
        </Text>
        <Text allowFontScaling={false} style={[styles.prompt, { color: c.ink }]}>
          {prompt}
        </Text>
      </ScrollView>
      <Text allowFontScaling={false} style={[styles.hint, { color: c.inkFaint }]}>
        {t('promptCover.hint')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 24,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  label: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 20,
  },
  prompt: {
    fontFamily: FONTS.serifItalic,
    fontSize: SIZES.xl,
    lineHeight: 34,
    textAlign: 'center',
  },
  hint: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 8,
  },
});
