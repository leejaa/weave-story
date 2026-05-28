import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { FONTS } from '@/constants/colors';
import { usePalette } from '@/hooks/use-palette';
import type { SampleCardData } from '@/lib/api/types';
import type { BookOrigin } from './use-book-selection';
import type { ShelfBook } from './use-shelf-books';
import { ShelfSampleBook } from './shelf-sample-book';

const BOOKSHELF_SCENE = require('@/assets/images/home/bookshelf-scene.png');

type Props = {
  books: ShelfBook[];
  isLoading: boolean;
  selectedCardId: string | null;
  onBookPress: (card: SampleCardData, origin: BookOrigin) => void;
};

export function ShelfStage({ books, isLoading, selectedCardId, onBookPress }: Props) {
  const c = usePalette();
  const focus = useSharedValue(0);

  useEffect(() => {
    focus.value = withTiming(selectedCardId ? 1 : 0, { duration: 260 });
  }, [focus, selectedCardId]);

  const stageStyle = useAnimatedStyle(() => ({
    opacity: interpolate(focus.value, [0, 1], [1, 0.18]),
    transform: [
      { scale: interpolate(focus.value, [0, 1], [1, 1.025]) },
      { translateY: interpolate(focus.value, [0, 1], [0, -10]) },
    ],
  }));

  const veilStyle = useAnimatedStyle(() => ({
    opacity: interpolate(focus.value, [0, 1], [0, 0.26]),
  }));

  return (
    <Animated.View style={[styles.stage, stageStyle]}>
      <Image source={BOOKSHELF_SCENE} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={styles.topVignette} pointerEvents="none" />
      <View style={styles.caption}>
        <Text style={[styles.eyebrow, { color: c.thread }]} allowFontScaling={false}>
          STORY SHELF
        </Text>
        <Text style={styles.captionText} allowFontScaling={false}>
          오늘의 책들이 조용히 첫 장면을 품고 있어요
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={c.thread} />
        </View>
      ) : (
        <View style={StyleSheet.absoluteFill}>
          {books.map((book, index) => (
            <ShelfSampleBook
              key={book.card.id}
              book={book}
              index={index}
              disabled={!!selectedCardId}
              onBookPress={onBookPress}
            />
          ))}
        </View>
      )}

      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.focusVeil, veilStyle]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    overflow: 'hidden',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(84,62,37,0.26)',
    backgroundColor: '#21180f',
  },
  topVignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  caption: {
    position: 'absolute',
    left: 28,
    right: 28,
    top: 26,
  },
  eyebrow: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 2.4,
  },
  captionText: {
    marginTop: 8,
    fontFamily: FONTS.sansMedium,
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(255,248,230,0.78)',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  focusVeil: {
    backgroundColor: '#000',
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
