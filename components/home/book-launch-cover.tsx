import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { FONTS } from '@/constants/colors';
import type { SampleCardData } from '@/lib/api/types';
import { CoverTitleText } from './cover-title-text';

type Props = {
  card: SampleCardData;
};

export function BookLaunchCover({ card }: Props) {
  return (
    <View style={[styles.book, { backgroundColor: card.color }]}>
      {card.imageUrl ? (
        <Image source={{ uri: card.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : null}
      <View style={styles.imageShade} />
      <View style={styles.titleShade} />
      <View style={styles.spine} />
      <View style={styles.rim} />
      <View style={styles.genrePill}>
        <Text style={styles.genre} numberOfLines={1} allowFontScaling={false}>
          {card.genreLabel}
        </Text>
      </View>
      <CoverTitleText title={card.title} />
    </View>
  );
}

const styles = StyleSheet.create({
  book: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 10,
    shadowColor: '#120d08',
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.42,
    shadowRadius: 28,
    elevation: 24,
  },
  imageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,5,3,0.04)',
  },
  titleShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '48%',
    backgroundColor: 'rgba(4,3,3,0.34)',
  },
  spine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 24,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: 'rgba(255,240,204,0.22)',
  },
  rim: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 10,
    bottom: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,235,190,0.48)',
  },
  genrePill: {
    position: 'absolute',
    top: 18,
    left: 24,
    maxWidth: 106,
    minHeight: 24,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8,7,6,0.54)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,239,210,0.38)',
  },
  genre: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    letterSpacing: 0.8,
    color: 'rgba(255,246,230,0.92)',
    textAlign: 'center',
  },
});
