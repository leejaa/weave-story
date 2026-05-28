import { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View, type View as RNView } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { FONTS } from '@/constants/colors';
import type { SampleCardData } from '@/lib/api/types';
import { CoverTitleText } from './cover-title-text';
import type { BookOrigin } from './use-book-selection';

type Props = {
  card: SampleCardData;
  index: number;
  disabled: boolean;
  onBookPress: (card: SampleCardData, origin: BookOrigin) => void;
};

export function SampleBookCover({ card, index, disabled, onBookPress }: Props) {
  const ref = useRef<RNView>(null);
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withDelay(
      index * 130,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1900, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
  }, [index, pulse]);

  const handlePress = useCallback(() => {
    ref.current?.measureInWindow((x, y, width, height) => {
      onBookPress(card, { x, y, width, height });
    });
  }, [card, onBookPress]);

  const bookStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(pulse.value, [0, 1], [0, -7]) },
      { rotateZ: `${interpolate(pulse.value, [0, 1], [-0.4, 0.8])}deg` },
      { scale: interpolate(pulse.value, [0, 1], [1, 1.018]) },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.18, 0.45]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.95, 1.04]) }],
  }));

  return (
    <Pressable
      ref={ref}
      collapsable={false}
      disabled={disabled}
      onPress={handlePress}
      style={styles.slot}
    >
      <Animated.View style={[styles.glow, glowStyle, disabled && styles.hidden]} pointerEvents="none" />
      <Animated.View style={[styles.book, disabled && styles.disabled, bookStyle]}>
        <View style={[styles.coverBase, { backgroundColor: card.color }]}>
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
        <View style={styles.pageBlock}>
          {Array.from({ length: 9 }).map((_, lineIndex) => (
            <View
              key={lineIndex}
              style={[
                styles.pageLine,
                {
                  top: `${8 + lineIndex * 9}%`,
                  opacity: lineIndex % 2 === 0 ? 0.2 : 0.09,
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: {
    width: 176,
    height: 286,
    marginRight: 18,
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    left: 10,
    right: 4,
    top: 20,
    bottom: 20,
    borderRadius: 14,
    backgroundColor: 'rgba(220,174,85,0.28)',
    shadowColor: '#dcae55',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 18,
    elevation: 16,
  },
  hidden: {
    opacity: 0,
  },
  book: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 10,
    shadowColor: '#120d08',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.34,
    shadowRadius: 24,
    elevation: 18,
  },
  disabled: {
    opacity: 0.48,
  },
  coverBase: {
    flex: 1,
    overflow: 'hidden',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
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
    textShadowColor: 'rgba(0,0,0,0.54)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  pageBlock: {
    width: 14,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#eadfc7',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: 'rgba(74,54,27,0.24)',
  },
  pageLine: {
    position: 'absolute',
    left: 1,
    right: 0,
    height: 1,
    backgroundColor: '#8b7d60',
  },
});
