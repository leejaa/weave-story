import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import type { SampleCardData } from '@/lib/api/types';
import type { BookOrigin } from './use-book-selection';

type Props = {
  card: SampleCardData | null;
  origin: BookOrigin | null;
  isVisible: boolean;
  onFinish: () => void;
};

export function BookExpandTransition({ card, origin, isVisible, onFinish }: Props) {
  const { width: screenW, height: screenH } = useWindowDimensions();

  // expand progress (0 → 1)
  const progress = useSharedValue(0);
  // overlay opacity — 확대 후 페이드아웃에 사용 (1 → 0)
  const curtainOp = useSharedValue(0);

  // 페이드아웃이 끝날 때까지 언마운트를 막는 내부 상태
  const [rendered, setRendered] = useState(false);

  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const stableFinish = useCallback(() => onFinishRef.current(), []);
  const unmount = useCallback(() => setRendered(false), []);

  // isVisible=true → 마운트 + expand 시작
  useEffect(() => {
    if (!isVisible || !card || !origin) return;
    setRendered(true);
    curtainOp.value = 1;
    progress.value = 0;
    progress.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }, (done) => {
      if (done) runOnJS(stableFinish)();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, card, origin]);

  // isVisible=false → 페이드아웃 후 언마운트
  useEffect(() => {
    if (!isVisible && rendered) {
      curtainOp.value = withTiming(0, { duration: 200 }, (done) => {
        if (done) runOnJS(unmount)();
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  // --- transform 계산 (워크릿 상수) ---
  // 풀스크린 뷰를 카드 위치·크기처럼 보이게 하는 초기 transform
  const cardCX = origin ? origin.x + origin.width  / 2 : screenW / 2;
  const cardCY = origin ? origin.y + origin.height / 2 : screenH / 2;
  const tx0    = cardCX - screenW / 2;
  const ty0    = cardCY - screenH / 2;
  const sx0    = origin ? origin.width  / screenW : 1;
  const sy0    = origin ? origin.height / screenH : 1;

  const expandStyle = useAnimatedStyle(() => ({
    opacity: curtainOp.value,
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [tx0, 0]) },
      { translateY: interpolate(progress.value, [0, 1], [ty0, 0]) },
      { scaleX:     interpolate(progress.value, [0, 1], [sx0, 1]) },
      { scaleY:     interpolate(progress.value, [0, 1], [sy0, 1]) },
    ],
  }));

  if (!rendered || !card || !origin) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View style={[styles.fill, { backgroundColor: card.color }, expandStyle]}>
        {card.imageUrl ? (
          <Image
            source={{ uri: card.imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : null}
        {/* 얇은 어두운 베일로 이미지 없는 카드도 색감 유지 */}
        <View style={[StyleSheet.absoluteFill, styles.veil]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  veil: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
});
