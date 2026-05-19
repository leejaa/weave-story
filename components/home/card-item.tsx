import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { FONTS, SIZES } from '@/constants/colors';
import { STACK_OFFSET, STACK_SCALES, SWIPE_THRESHOLD } from '@/lib/sample-covers/constants';
import type { SampleCardData } from '@/lib/api/types';

type Props = {
  card: SampleCardData;
  cardIndex: number;
  totalCards: number;
  topIndex: SharedValue<number>;
  swipeX: SharedValue<number>;
  swipeY: SharedValue<number>;
  cardWidth: number;
  cardHeight: number;
};

// Stays mounted for the lifetime of the stack — expo-image never reloads.
export function CardItem({ card, cardIndex, totalCards, topIndex, swipeX, swipeY, cardWidth, cardHeight }: Props) {
  const animStyle = useAnimatedStyle(() => {
    const N = totalCards;
    const stackPos = (topIndex.value - cardIndex + N * 4) % N;

    // Cards beyond slot 3 are completely hidden, no animation.
    if (stackPos > 3) {
      return { opacity: 0, zIndex: -10 };
    }

    const progress = interpolate(
      Math.abs(swipeX.value),
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    );

    const restTX = stackPos * STACK_OFFSET;
    const restTY = -(stackPos * STACK_OFFSET);
    const nextTX = (stackPos - 1) * STACK_OFFSET;
    const nextTY = -((stackPos - 1) * STACK_OFFSET);
    const restScale = STACK_SCALES[Math.min(stackPos, 2)] ?? 0.93;
    const nextScale = STACK_SCALES[Math.max(stackPos - 1, 0)] ?? 1.0;

    if (stackPos === 0) {
      return {
        opacity: 1,
        zIndex: 10,
        transform: [
          { translateX: swipeX.value + restTX },
          { translateY: swipeY.value + restTY },
          {
            rotate: `${interpolate(
              swipeX.value,
              [-300, 0, 300],
              [-12, 0, 12],
              Extrapolation.CLAMP,
            )}deg`,
          },
        ],
      };
    }

    // stackPos 1, 2: always visible; stackPos 3: fades in during swipe
    const opacity =
      stackPos === 3
        ? interpolate(progress, [0.3, 1], [0, 1], Extrapolation.CLAMP)
        : 1;

    return {
      opacity,
      zIndex: stackPos === 3 ? 0 : 10 - stackPos * 3,
      transform: [
        { translateX: interpolate(progress, [0, 1], [restTX, nextTX]) },
        { translateY: interpolate(progress, [0, 1], [restTY, nextTY]) },
        { rotate: `${interpolate(progress, [0, 1], [stackPos * -3, (stackPos - 1) * -3])}deg` },
        { scale: interpolate(progress, [0, 1], [restScale, nextScale]) },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.card,
        {
          top: STACK_OFFSET * 2,
          left: 0,
          width: cardWidth,
          height: cardHeight,
          backgroundColor: card.color,
        },
        animStyle,
      ]}
    >
      {card.imageUrl ? (
        <Image source={{ uri: card.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : null}
      <View style={styles.scrim} />
      <Text style={styles.genre} allowFontScaling={false}>{card.genreLabel}</Text>
      <Text style={styles.title} numberOfLines={3} allowFontScaling={false}>{card.title}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '48%',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  genre: {
    position: 'absolute',
    top: 16,
    left: 14,
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 1.8,
    color: 'rgba(255,255,255,0.65)',
    textTransform: 'uppercase',
  },
  title: {
    position: 'absolute',
    bottom: 18,
    left: 14,
    right: 14,
    fontFamily: FONTS.serifSemibold,
    fontSize: SIZES.lg,
    color: '#ffffff',
    lineHeight: 25,
  },
});
