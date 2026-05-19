import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
import { useTranslation } from 'react-i18next';
import { usePalette } from '@/hooks/use-palette';
import { FONTS, SIZES } from '@/constants/colors';
import { InkBloom } from '@/components/reading/ink-bloom';
import { FloatingParticles } from '@/components/reading/floating-particles';
import { getGenreParticles } from '@/lib/reading/genre-particles';

// ─── Bouncing dot ─────────────────────────────────────────────────────────────

function BounceDot({ delay, color }: { delay: number; color: string }) {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 320, easing: Easing.out(Easing.quad) }),
          withTiming(0.5, { duration: 320, easing: Easing.in(Easing.quad) }),
          withTiming(0.5, { duration: 360 }),
        ),
        -1,
        false,
      ),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 320 }),
          withTiming(0.3, { duration: 320 }),
          withTiming(0.3, { duration: 360 }),
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
      style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }, style]}
    />
  );
}

// ─── Center emoji ─────────────────────────────────────────────────────────────

function BreathingEmoji({ emoji, color }: { emoji: string; color: string }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.93, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(scale);
  }, []);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.Text style={[styles.emoji, style]}>{emoji}</Animated.Text>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Props = {
  genre?: string | null;
};

export function GeneratingPage({ genre }: Props) {
  const c = usePalette();
  const { t } = useTranslation('reading');
  const particleSet = getGenreParticles(genre);

  return (
    <View style={[styles.page, { backgroundColor: c.paper }]}>
      <InkBloom color={c.ink} />
      <FloatingParticles particles={particleSet.particles} color={c.inkSoft} />

      <View style={styles.content}>
        <BreathingEmoji emoji={particleSet.centerEmoji} color={c.ink} />

        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: c.ink }]}>{t('generating.title')}</Text>
          <Text style={[styles.body, { color: c.inkSoft }]}>{t('generating.body')}</Text>
        </View>

        <View style={styles.dots}>
          <BounceDot delay={0} color={c.thread} />
          <BounceDot delay={200} color={c.thread} />
          <BounceDot delay={400} color={c.thread} />
        </View>

        <Text style={[styles.estimate, { color: c.inkFaint }]}>{t('generating.estimate')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 28,
    paddingHorizontal: 40,
  },
  emoji: {
    fontSize: 64,
  },
  textBlock: {
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: SIZES['2xl'],
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: 0,
  },
  body: {
    fontFamily: FONTS.serifItalic,
    fontSize: SIZES.md,
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  estimate: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1,
  },
});
