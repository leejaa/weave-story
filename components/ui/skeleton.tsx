import { useEffect } from 'react';
import { type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { usePalette } from '@/hooks/use-palette';

type SkeletonProps = {
  width?: number | `${number}%`;
  height?: number | `${number}%`;
  radius?: number;
  /** 배경 색 오버라이드(예: 어두운 배경 위에서는 반투명 라이트 색). 기본은 paperSunk. */
  color?: string;
  style?: ViewStyle;
};

/** 은은하게 맥동하는 플레이스홀더 블록. 로딩 중 실제 콘텐츠 형태를 미리 보여준다. */
export function Skeleton({ width, height, radius = 8, color, style }: SkeletonProps) {
  const c = usePalette();
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 850, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: color ?? c.paperSunk },
        animatedStyle,
        style,
      ]}
    />
  );
}
