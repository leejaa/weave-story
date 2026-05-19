import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const BASE_SIZE = 100;
const MAX_SCALE = 5;
const BLOOM_MS = 3000;
const GAP_MS = 600;
const PERIOD = BLOOM_MS + GAP_MS;
const RING_COUNT = 4;

type RingProps = { delay: number; color: string };

function BloomRing({ delay, color }: RingProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(MAX_SCALE, { duration: BLOOM_MS, easing: Easing.out(Easing.cubic) }),
          withTiming(MAX_SCALE, { duration: GAP_MS }),
        ),
        -1,
        false,
      ),
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(0.28, { duration: 250, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: BLOOM_MS - 250 }),
          withTiming(0, { duration: GAP_MS }),
        ),
        -1,
        false,
      ),
    );

    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.ring,
        { width: BASE_SIZE, height: BASE_SIZE, borderRadius: BASE_SIZE / 2, borderColor: color },
        style,
      ]}
    />
  );
}

type Props = { color: string };

export function InkBloom({ color }: Props) {
  return (
    <View style={styles.container} pointerEvents="none">
      {Array.from({ length: RING_COUNT }, (_, i) => (
        <BloomRing key={i} delay={(PERIOD / RING_COUNT) * i} color={color} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
  },
});
