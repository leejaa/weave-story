import { useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useFocusEffect } from 'expo-router';
import { FONTS, SIZES } from '@/constants/colors';
import type { SampleCardData } from '@/lib/api/types';
import { SampleBookCover } from './sample-book-cover';
import type { BookOrigin } from './use-book-selection';

const HOME_BG = require('@/assets/videos/home-bg.mp4');

type Props = {
  headline: string;
  cards: SampleCardData[];
  isLoading: boolean;
  selectedCardId: string | null;
  onBookPress: (card: SampleCardData, origin: BookOrigin) => void;
};

export function BookCoverGallery({ headline, cards, isLoading, selectedCardId, onBookPress }: Props) {
  const player = useVideoPlayer(HOME_BG, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  // Pause the loop while the user is on another tab (saves battery/GPU),
  // resume when the home tab regains focus.
  useFocusEffect(
    useCallback(() => {
      player.play();
      return () => player.pause();
    }, [player]),
  );

  return (
    <View style={styles.stage}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
      {/* Scrim: darkens the busy video so the headline + book covers stay legible. */}
      <View style={styles.scrim} pointerEvents="none" />
      {/* Two-stop bottom fade so the (transparent) floating tab bar's labels stay
          readable while the video still shows faintly behind it. */}
      <View style={styles.floor1} pointerEvents="none" />
      <View style={styles.floor2} pointerEvents="none" />

      <View style={styles.header} pointerEvents="none">
        <Text style={styles.headline} allowFontScaling={false}>
          {headline}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="rgba(245,240,232,0.75)" />
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
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#0d0b10', // shown briefly before the video first paints
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,8,12,0.42)',
  },
  floor1: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 220,
    backgroundColor: 'rgba(8,6,10,0.26)',
  },
  floor2: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 96,
    backgroundColor: 'rgba(4,3,6,0.5)',
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
    color: 'rgba(245,240,232,0.96)',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
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
});
