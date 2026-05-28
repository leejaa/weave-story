import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { FONTS, SIZES } from '@/constants/colors';
import type { SampleCardData } from '@/lib/api/types';
import { SampleBookCover } from './sample-book-cover';
import type { BookOrigin } from './use-book-selection';

const BOOKSTORE_DISPLAY = require('@/assets/images/home/bookstore-bestseller-display.png');

type Props = {
  headline: string;
  cards: SampleCardData[];
  isLoading: boolean;
  selectedCardId: string | null;
  onBookPress: (card: SampleCardData, origin: BookOrigin) => void;
};

export function BookCoverGallery({ headline, cards, isLoading, selectedCardId, onBookPress }: Props) {
  return (
    <View style={styles.stage}>
      <Image source={BOOKSTORE_DISPLAY} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={styles.backdropWash} pointerEvents="none" />
      <View style={styles.lightPool} pointerEvents="none" />
      <View style={styles.header} pointerEvents="none">
        <Text style={styles.headline} allowFontScaling={false}>
          {headline}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#7b5a2c" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroller}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rail}
          decelerationRate="fast"
        >
          {cards.map((card, index) => (
            <SampleBookCover
              key={card.id}
              card={card}
              index={index}
              disabled={!!selectedCardId}
              onBookPress={onBookPress}
            />
          ))}
        </ScrollView>
      )}
      <View style={styles.floorShade} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#f0cf9d',
  },
  backdropWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,245,226,0.10)',
  },
  lightPool: {
    position: 'absolute',
    left: -80,
    right: -80,
    top: 58,
    height: 240,
    borderRadius: 180,
    backgroundColor: 'rgba(255,255,255,0.16)',
    transform: [{ scaleX: 1.18 }],
  },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    paddingHorizontal: 28,
    paddingTop: 28,
  },
  headline: {
    fontFamily: FONTS.display,
    fontSize: SIZES['3xl'],
    lineHeight: 44,
    color: 'rgba(45,36,23,0.88)',
    textShadowColor: 'rgba(255,248,232,0.42)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroller: {
    flex: 1,
    marginTop: 134,
  },
  rail: {
    paddingLeft: 26,
    paddingRight: 8,
    paddingTop: 18,
    paddingBottom: 34,
    alignItems: 'center',
  },
  floorShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 112,
    backgroundColor: 'rgba(98,58,18,0.06)',
  },
});
