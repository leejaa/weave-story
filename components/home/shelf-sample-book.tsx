import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent, type View as RNView } from 'react-native';
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
import type { BookOrigin } from './use-book-selection';
import type { ShelfBook } from './use-shelf-books';

type Props = {
  book: ShelfBook;
  index: number;
  disabled: boolean;
  onBookPress: (card: SampleCardData, origin: BookOrigin) => void;
};

export function ShelfSampleBook({ book, index, disabled, onBookPress }: Props) {
  const { card, frame } = book;
  const ref = useRef<RNView>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const lift = useSharedValue(0);

  useEffect(() => {
    lift.value = withDelay(
      index * 180,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
  }, [index, lift]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  }, []);

  const handlePress = useCallback(() => {
    ref.current?.measureInWindow((x, y, width, height) => {
      onBookPress(card, { x, y, width, height });
    });
  }, [card, onBookPress]);

  const bookStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(lift.value, [0, 1], [0, -5]) },
      { scale: interpolate(lift.value, [0, 1], [1, 1.018]) },
    ],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: interpolate(lift.value, [0, 1], [0.28, 0.58]),
    transform: [{ scale: interpolate(lift.value, [0, 1], [0.96, 1.04]) }],
  }));

  const width = size.width;
  const height = size.height;
  const pageW = Math.max(4, width * 0.13);
  const bindingW = Math.max(5, width * 0.14);
  const spineW = Math.max(1, width - pageW);
  const pageLines = Math.max(8, Math.floor(height / 15));

  return (
    <Pressable
      ref={ref}
      collapsable={false}
      disabled={disabled}
      onLayout={handleLayout}
      onPress={handlePress}
      style={[
        styles.slot,
        {
          left: `${frame.left * 100}%`,
          top: `${frame.top * 100}%`,
          width: `${frame.width * 100}%`,
          height: `${frame.height * 100}%`,
        },
      ]}
    >
      <Animated.View pointerEvents="none" style={[styles.halo, haloStyle, disabled && styles.haloDisabled]} />
      <Animated.View style={[styles.book, disabled && styles.bookDisabled, bookStyle]}>
        <View style={[styles.spine, { width: spineW, backgroundColor: card.color }]}>
          {card.imageUrl ? (
            <Image
              source={{ uri: card.imageUrl }}
              style={[StyleSheet.absoluteFill, styles.coverImage]}
              contentFit="cover"
            />
          ) : null}
          <View style={[styles.binding, { width: bindingW }]} />
          <View style={styles.spineGloss} />
          <View style={styles.spineShade} />
          <View style={styles.paperGlow} />
        </View>

        <View style={[styles.pageEdge, { width: pageW }]}>
          {Array.from({ length: pageLines }).map((_, lineIndex) => (
            <View
              key={lineIndex}
              style={[
                styles.pageLine,
                {
                  top: Math.round((height / pageLines) * lineIndex),
                  opacity: lineIndex % 3 === 0 ? 0.22 : 0.08,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.titleWrap} pointerEvents="none">
          <Text
            numberOfLines={1}
            allowFontScaling={false}
            style={[styles.title, { width: Math.max(60, height - 24) }]}
          >
            {card.title}
          </Text>
        </View>
        <View style={styles.rim} pointerEvents="none" />
        <View style={styles.touchRim} pointerEvents="none" />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: {
    position: 'absolute',
    padding: 4,
  },
  halo: {
    position: 'absolute',
    left: -2,
    right: -2,
    top: -4,
    bottom: -4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,214,128,0.20)',
    shadowColor: '#ffd680',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.72,
    shadowRadius: 12,
    elevation: 10,
  },
  haloDisabled: {
    opacity: 0,
  },
  book: {
    flex: 1,
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.42,
    shadowRadius: 12,
    elevation: 12,
  },
  bookDisabled: {
    opacity: 0.58,
  },
  spine: {
    height: '100%',
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    overflow: 'hidden',
  },
  coverImage: {
    opacity: 0.16,
  },
  binding: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.34)',
  },
  spineGloss: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '34%',
    backgroundColor: 'rgba(255,248,226,0.12)',
  },
  spineShade: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '28%',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  paperGlow: {
    position: 'absolute',
    left: 1,
    top: 1,
    right: 1,
    bottom: 1,
    borderRadius: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,242,204,0.30)',
  },
  pageEdge: {
    height: '100%',
    backgroundColor: '#ece4d0',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    overflow: 'hidden',
  },
  pageLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#837456',
  },
  titleWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.serifItalic,
    fontSize: 11,
    lineHeight: 15,
    color: 'rgba(255,250,236,0.92)',
    textAlign: 'center',
    transform: [{ rotate: '-90deg' }],
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  rim: {
    position: 'absolute',
    left: -1,
    right: -1,
    top: -1,
    bottom: -1,
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,232,176,0.42)',
  },
  touchRim: {
    position: 'absolute',
    left: 1,
    right: 1,
    top: 1,
    bottom: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,246,216,0.22)',
  },
});
