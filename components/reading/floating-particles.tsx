import { useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { ParticleItem } from '@/lib/reading/genre-particles';

// Pre-defined spreads so particles are evenly scattered, not bunched
const X_RATIOS  = [0.06, 0.17, 0.27, 0.38, 0.48, 0.58, 0.68, 0.78, 0.88, 0.12, 0.32, 0.52, 0.72, 0.92, 0.22, 0.62];
const FONT_SIZES = [16, 20, 15, 22, 17, 19, 14, 21, 18, 16, 20, 15, 22, 17, 19, 21];
const DURATIONS  = [6200, 7100, 5800, 7600, 6500, 8000, 5600, 7400, 6900, 6300, 7200, 5900, 8100, 6700, 7500, 6000];
const DELAYS     = [0, 900, 1800, 2700, 400, 1300, 2200, 3100, 600, 1500, 2400, 3300, 800, 1700, 2600, 3500];

type ItemProps = {
  label: string;
  xPx: number;
  size: number;
  duration: number;
  delay: number;
  screenHeight: number;
  color: string;
};

function FloatingItem({ label, xPx, size, duration, delay, screenHeight, color }: ItemProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(1, { duration, easing: Easing.linear }),
        ),
        -1,
        false,
      ),
    );

    return () => {
      cancelAnimation(progress);
    };
  }, []);

  const style = useAnimatedStyle(() => {
    const ty = interpolate(progress.value, [0, 1], [screenHeight + 30, -80]);
    const op = interpolate(progress.value, [0, 0.07, 0.75, 1], [0, 0.8, 0.8, 0]);
    return { transform: [{ translateY: ty }], opacity: op };
  });

  return (
    <Animated.Text style={[styles.item, { left: xPx, fontSize: size, color }, style]}>
      {label}
    </Animated.Text>
  );
}

type Props = {
  particles: ParticleItem[];
  color: string;
};

export function FloatingParticles({ particles, color }: Props) {
  const { width, height } = useWindowDimensions();

  const items = useMemo(() => {
    const pool = [...particles, ...particles, ...particles].slice(0, 16);
    return pool.map((p, i) => ({
      label: p.label,
      xPx: width * X_RATIOS[i % X_RATIOS.length],
      size: FONT_SIZES[i % FONT_SIZES.length],
      duration: DURATIONS[i % DURATIONS.length],
      delay: DELAYS[i % DELAYS.length],
    }));
  }, [particles, width]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {items.map((item, i) => (
        <FloatingItem
          key={i}
          label={item.label}
          xPx={item.xPx}
          size={item.size}
          duration={item.duration}
          delay={item.delay}
          screenHeight={height}
          color={color}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    position: 'absolute',
  },
});
