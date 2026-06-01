import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePalette } from '@/hooks/use-palette';
import { Icon } from '@/components/ui/icon';
import { FONTS, SIZES } from '@/constants/colors';

type Props = {
  situation: string | null;
  question: string | null;
  onOpen: () => void;
};

export function ChoiceEntryPage({ situation, question, onOpen }: Props) {
  const c = usePalette();
  const { t } = useTranslation('reading');

  return (
    <View style={styles.page}>
      <View style={styles.content}>
        <Text style={[styles.kicker, { color: c.inkFaint }]}>
          {t('choice.entryKicker')}
        </Text>
        {situation ? (
          <Text style={[styles.situation, { color: c.inkSoft }]}>
            {situation}
          </Text>
        ) : null}
        <Text style={[styles.question, { color: c.ink }]}>
          {question || t('choice.defaultQuestion')}
        </Text>
        <Pressable
          onPress={onOpen}
          style={[styles.button, { backgroundColor: c.thread }]}>
          <Text style={[styles.buttonLabel, { color: c.paper }]}>
            {t('choice.openChoice')}
          </Text>
          <Icon name="chevron-right" size={18} color={c.paper} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    gap: 18,
  },
  kicker: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  situation: {
    fontFamily: FONTS.serifItalic,
    fontSize: SIZES.lg,
    lineHeight: 30,
  },
  question: {
    fontFamily: FONTS.serifSemibold,
    fontSize: SIZES['2xl'],
    lineHeight: 34,
  },
  button: {
    marginTop: 10,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonLabel: {
    fontFamily: FONTS.sansSemibold,
    fontSize: SIZES.md,
  },
});
