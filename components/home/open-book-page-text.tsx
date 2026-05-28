import { StyleSheet, Text } from 'react-native';
import { FONTS, SIZES } from '@/constants/colors';
import type { SampleCardData } from '@/lib/api/types';

type Props = {
  card: SampleCardData;
};

export function OpenBookPageText({ card }: Props) {
  return (
    <>
      <Text style={styles.genre} numberOfLines={1} allowFontScaling={false}>
        {card.genreLabel}
      </Text>
      <Text style={styles.title} numberOfLines={2} allowFontScaling={false}>
        {card.title}
      </Text>
      <Text style={styles.prompt} numberOfLines={6} allowFontScaling={false}>
        {card.prompt}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  genre: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: 'rgba(72,56,36,0.52)',
  },
  title: {
    marginTop: 10,
    fontFamily: FONTS.cover,
    fontSize: SIZES.xl,
    lineHeight: 25,
    color: 'rgba(48,36,22,0.82)',
  },
  prompt: {
    marginTop: 12,
    fontFamily: FONTS.serif,
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(55,39,24,0.64)',
  },
});
