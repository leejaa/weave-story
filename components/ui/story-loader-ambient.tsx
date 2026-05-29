import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  RadialGradient,
  Blur,
  vec,
} from '@shopify/react-native-skia';
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const SIZE = 260;
const CENTER = SIZE / 2;

type DustSpec = {
  angle: number;
  radius: number;
  size: number;
  phase: number;
};

// Low-density, deterministic gold dust — elegant, not busy.
const DUST: DustSpec[] = [
  { angle: 0.3, radius: 96, size: 2.2, phase: 0.0 },
  { angle: 1.1, radius: 110, size: 1.6, phase: 0.35 },
  { angle: 2.0, radius: 84, size: 2.6, phase: 0.7 },
  { angle: 2.9, radius: 118, size: 1.8, phase: 0.15 },
  { angle: 3.7, radius: 92, size: 2.0, phase: 0.55 },
  { angle: 4.6, radius: 108, size: 1.5, phase: 0.85 },
  { angle: 5.4, radius: 100, size: 2.4, phase: 0.25 },
];

const GOLD_CORE = 'rgba(255,243,196,0.95)';
const GOLD_MID = 'rgba(230,178,90,0.55)';
const GOLD_EDGE = 'rgba(182,134,42,0)';

function GoldDust({ spec, t }: { spec: DustSpec; t: SharedTime }) {
  const cx = CENTER + Math.cos(spec.angle) * spec.radius;
  const cy = CENTER + Math.sin(spec.angle) * spec.radius;

  const opacity = useDerivedValue(() => {
    const wave = (Math.sin((t.value + spec.phase) * Math.PI * 2) + 1) / 2;
    return 0.15 + wave * 0.6;
  });

  const drift = useDerivedValue(() => {
    return Math.sin((t.value + spec.phase) * Math.PI * 2) * 4;
  });

  const transform = useDerivedValue(() => [{ translateY: drift.value }]);

  return (
    <Group transform={transform} opacity={opacity}>
      <Circle cx={cx} cy={cy} r={spec.size}>
        <RadialGradient
          c={vec(cx, cy)}
          r={spec.size * 2.4}
          colors={[GOLD_CORE, GOLD_EDGE]}
        />
      </Circle>
    </Group>
  );
}

type SharedTime = ReturnType<typeof useSharedValue<number>>;

export function StoryLoaderAmbient() {
  const t = useSharedValue(0);
  const ring = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 4200, easing: Easing.linear }), -1, false);
    ring.value = withRepeat(withTiming(1, { duration: 9000, easing: Easing.linear }), -1, false);
  }, [ring, t]);

  const ringOpacity = useDerivedValue(() => {
    const wave = (Math.sin(t.value * Math.PI * 2) + 1) / 2;
    return 0.2 + wave * 0.22;
  });

  const ringTransform = useDerivedValue(() => [
    { rotate: ring.value * Math.PI * 2 },
  ]);

  return (
    <Canvas style={styles.canvas} pointerEvents="none">
      <Group opacity={ringOpacity}>
        <Circle cx={CENTER} cy={CENTER} r={104}>
          <RadialGradient
            c={vec(CENTER, CENTER)}
            r={130}
            colors={['rgba(255,243,196,0)', GOLD_MID, GOLD_EDGE]}
            positions={[0.55, 0.8, 1]}
          />
          <Blur blur={6} />
        </Circle>
      </Group>

      <Group origin={vec(CENTER, CENTER)} transform={ringTransform}>
        {DUST.map((spec, i) => (
          <GoldDust key={i} spec={spec} t={t} />
        ))}
      </Group>
    </Canvas>
  );
}

const styles = StyleSheet.create({
  canvas: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
  },
});
