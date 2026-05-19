import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePalette } from '@/hooks/use-palette';
import { FONTS, SIZES } from '@/constants/colors';

type Props = { text: string };

export function InterventionPage({ text }: Props) {
  const c = usePalette();
  const { t } = useTranslation('reading');

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.line, { backgroundColor: c.rule }]} />
        <Text style={[styles.label, { color: c.inkFaint }]}>
          {t('choice.yourChoice').toUpperCase()}
        </Text>
        <Text style={[styles.choiceText, { color: c.inkSoft }]}>
          "{text}"
        </Text>
        <View style={[styles.line, { backgroundColor: c.rule }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '75%',
    alignItems: 'center',
    gap: 20,
  },
  line: {
    width: '100%',
    height: 1,
  },
  label: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.xs,
    letterSpacing: 2,
  },
  choiceText: {
    fontFamily: FONTS.serifItalic,
    fontSize: SIZES.lg,
    lineHeight: 28,
    textAlign: 'center',
  },
});
