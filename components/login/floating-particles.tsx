import React, { useEffect } from 'react';
import { StyleSheet, Text, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { FONTS } from '@/constants/colors';
import { usePalette } from '@/hooks/use-palette';

const FRAGMENTS = [
  'once upon a time',
  'she chose her path',
  'a new chapter',
  'words came alive',
  'in the quiet dark',
  'he turned the page',
  'woven together',
  'the choice was made',
  'somewhere far away',
  'a voice in the dark',
  'the story unfolded',
  'an unknown ending',
];

type ParticleProps = {
  text: string;
  xRatio: number;
  yRatio: number;
  duration: number;
  delay: number;
  maxOpacity: number;
  fontSize: number;
};

function Particle({ text, xRatio, yRatio, duration, delay, maxOpacity, fontSize }: ParticleProps) {
  const c = usePalette();
  const { width, height } = useWindowDimensions();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    const travel = height * 0.25;

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(maxOpacity, { duration: duration * 0.25, easing: Easing.out(Easing.ease) }),
          withTiming(maxOpacity, { duration: duration * 0.5 }),
          withTiming(0, { duration: duration * 0.25, easing: Easing.in(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );

    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-travel, { duration, easing: Easing.linear }),
        -1,
        false,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        { left: xRatio * width, top: yRatio * height },
        style,
      ]}>
      <Text style={[styles.text, { color: c.thread, fontSize }]}>{text}</Text>
    </Animated.View>
  );
}

function seededRand(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

export function FloatingParticles() {
  const configs: ParticleProps[] = FRAGMENTS.map((text, i) => ({
    text,
    xRatio: seededRand(i * 3) * 0.8,
    yRatio: 0.3 + seededRand(i * 3 + 1) * 0.55,
    duration: 7000 + seededRand(i * 3 + 2) * 6000,
    delay: seededRand(i * 7) * 8000,
    maxOpacity: 0.08 + seededRand(i * 5) * 0.1,
    fontSize: 10 + seededRand(i * 11) * 6,
  }));

  return (
    <>
      {configs.map((cfg, i) => (
        <Particle key={i} {...cfg} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
  },
  text: {
    fontFamily: FONTS.serifItalic,
  },
});
