import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
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

  // onFinish를 ref로 안정화 — deps에서 제거해 애니메이션 도중 재실행 방지
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const handleFinish = useCallback(() => {
    onFinishRef.current();
  }, []);

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
        if (finished) runOnJS(handleFinish)();
      },
    );
  }, [card, handleFinish, isVisible, origin, progress]);

  // 최종(target) 위치·크기 — 뷰를 여기에 고정 배치
  const targetWidth  = Math.min(width * 0.48, 190);
  const targetHeight = targetWidth * 1.42;
  const targetX      = width * 0.12;
  const targetY      = height * 0.25;

  // 출발점·도착점 중심 좌표 & 배율 — 워크릿 상수로 캡처
  const endCX   = targetX + targetWidth  / 2;
  const endCY   = targetY + targetHeight / 2;
  const startCX = origin ? origin.x + origin.width  / 2 : endCX;
  const startCY = origin ? origin.y + origin.height / 2 : endCY;
  const sx0     = origin ? origin.width  / targetWidth  : 1;
  const sy0     = origin ? origin.height / targetHeight : 1;

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 0.32], Extrapolation.CLAMP),
  }));

  const coverStyle = useAnimatedStyle(() => {
    const tx     = interpolate(progress.value, [0, 1],    [startCX - endCX, 0],      Extrapolation.CLAMP);
    const tyBase = interpolate(progress.value, [0, 1],    [startCY - endCY, -8],     Extrapolation.CLAMP);
    const tyArc  = interpolate(progress.value, [0, 0.4, 1], [0, -20, 0],            Extrapolation.CLAMP);
    const sx     = interpolate(progress.value, [0, 1],    [sx0, 1],                  Extrapolation.CLAMP);
    const sy     = interpolate(progress.value, [0, 1],    [sy0, 1],                  Extrapolation.CLAMP);

    return {
      transform: [
        { translateX: tx },
        { translateY: tyBase + tyArc },
        { scaleX: sx },
        { scaleY: sy },
        { perspective: 900 },
        { rotateZ: `${interpolate(progress.value, [0, 1], [0, -12], Extrapolation.CLAMP)}deg` },
        { rotateY: `${interpolate(progress.value, [0, 1], [0, -28], Extrapolation.CLAMP)}deg` },
      ],
    };
  });

  // isVisible=false 이면 null 반환 — 뷰 자체를 마운트하지 않음
  if (!card || !origin || !isVisible) return null;

  // ← 핵심: Modal 제거. 같은 뷰 계층에 absoluteFill로 렌더링.
  // 카드 opacity 변경과 이 overlay가 동일한 React commit에서 처리되어
  // 네이티브 프레임이 완전히 일치 → 반짝임 없음.
  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]} />
      <Animated.View
        style={[
          styles.coverWrap,
          { left: targetX, top: targetY, width: targetWidth, height: targetHeight },
          coverStyle,
        ]}
      >
        <BookLaunchCover card={card} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // 전체 화면을 덮는 overlay — Modal 없이 동일 뷰 계층에서 렌더링
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  scrim: {
    backgroundColor: '#0f0904',
  },
  coverWrap: {
    position: 'absolute',
  },
});
