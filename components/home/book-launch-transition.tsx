import { useEffect } from 'react';
import { Modal, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { SampleCardData } from '@/lib/api/types';
import { BookLaunchCover } from './book-launch-cover';
import type { BookOrigin } from './use-book-selection';

type Props = {
  card: SampleCardData | null;
  origin: BookOrigin | null;
  isVisible: boolean;
  onFinish: () => void;
};

export function BookLaunchTransition({ card, origin, isVisible, onFinish }: Props) {
  const { width, height } = useWindowDimensions();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!isVisible || !card || !origin) {
      progress.value = 0;
      return;
    }

    progress.value = 0;
    progress.value = withTiming(
      1,
      { duration: 720, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(onFinish)();
        }
      },
    );
  }, [card, isVisible, onFinish, origin, progress]);

  const targetWidth = Math.min(width * 0.48, 190);
  const targetHeight = targetWidth * 1.42;
  const targetX = width * 0.12;
  const targetY = height * 0.25;

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 0.32], Extrapolation.CLAMP),
  }));

  const coverStyle = useAnimatedStyle(() => {
    const start = origin ?? { x: targetX, y: targetY, width: targetWidth, height: targetHeight };

    return {
      left: interpolate(progress.value, [0, 1], [start.x, targetX], Extrapolation.CLAMP),
      top: interpolate(progress.value, [0, 1], [start.y, targetY], Extrapolation.CLAMP),
      width: interpolate(progress.value, [0, 1], [start.width, targetWidth], Extrapolation.CLAMP),
      height: interpolate(progress.value, [0, 1], [start.height, targetHeight], Extrapolation.CLAMP),
      transform: [
        { perspective: 900 },
        { rotateZ: `${interpolate(progress.value, [0, 1], [0, -12])}deg` },
        { rotateY: `${interpolate(progress.value, [0, 1], [0, -28])}deg` },
        { translateY: interpolate(progress.value, [0, 0.38, 1], [0, -22, -10], Extrapolation.CLAMP) },
      ],
    };
  });

  if (!card || !origin || !isVisible) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <View style={styles.root} pointerEvents="none">
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]} />
        <Animated.View style={[styles.coverWrap, coverStyle]}>
          <BookLaunchCover card={card} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrim: {
    backgroundColor: '#0f0904',
  },
  coverWrap: {
    position: 'absolute',
  },
});
