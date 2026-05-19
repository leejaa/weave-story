import { useCallback, useRef } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSharedValue, withTiming, withSpring, runOnJS } from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';
import { SWIPE_THRESHOLD } from '@/lib/sample-covers/constants';

export function useCardStack(totalCards: number, onTap?: (frontIndex: number) => void) {
  const { width } = useWindowDimensions();

  const topIndex    = useSharedValue(totalCards - 1);
  const swipeX      = useSharedValue(0);
  const swipeY      = useSharedValue(0);
  const isAnimating = useSharedValue(false);

  const onTapRef = useRef(onTap);
  onTapRef.current = onTap;
  const callOnTap = useCallback((frontIndex: number) => {
    onTapRef.current?.(frontIndex);
  }, []);

  const cycleNext = useCallback(() => {
    swipeX.value = 0;
    swipeY.value = 0;
    topIndex.value = (topIndex.value - 1 + totalCards) % totalCards;
    isAnimating.value = false;
  }, [topIndex, swipeX, swipeY, isAnimating, totalCards]);

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-25, 25])
    .onUpdate((e) => {
      if (isAnimating.value) return;
      swipeX.value = e.translationX;
      swipeY.value = e.translationY * 0.12;
    })
    .onEnd((e) => {
      if (isAnimating.value) return;
      const shouldSwipe = e.translationX < -SWIPE_THRESHOLD || e.velocityX < -600;
      if (shouldSwipe) {
        isAnimating.value = true;
        swipeX.value = withTiming(-(width * 1.5), { duration: 260 }, (finished) => {
          if (finished) runOnJS(cycleNext)();
        });
      } else {
        swipeX.value = withSpring(0, { damping: 15, stiffness: 150 });
        swipeY.value = withSpring(0, { damping: 15, stiffness: 150 });
      }
    });

  const tap = Gesture.Tap()
    .maxDeltaX(10)
    .maxDeltaY(10)
    .onEnd(() => {
      if (!isAnimating.value) runOnJS(callOnTap)(topIndex.value);
    });

  const gesture = Gesture.Race(pan, tap);

  return { gesture, topIndex, swipeX, swipeY };
}
