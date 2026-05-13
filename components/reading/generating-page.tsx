import { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePalette } from '@/hooks/use-palette';
import { FONTS, SIZES } from '@/constants/colors';

// Claude Sonnet 4.6 benchmark: ~48 t/s, chapter output ~4500 tokens → ~95s
const ESTIMATED_MS = 95_000;

type Props = {
  /** Called repeatedly so the parent can poll and decide to navigate away */
  onComplete?: () => void;
};

export function GeneratingPage({ onComplete }: Props) {
  const c = usePalette();
  const { t } = useTranslation('reading');
  const progress = useRef(new Animated.Value(0)).current;
  const completedRef = useRef(false);

  useEffect(() => {
    // Animate to 90% over estimated duration, then stall waiting for real completion
    Animated.timing(progress, {
      toValue: 0.9,
      duration: ESTIMATED_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, []);

  const fillWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.page, { backgroundColor: c.paper }]}>
      <View style={styles.center}>
        <Text style={[styles.title, { color: c.ink }]}>{t('generating.title')}</Text>
        <Text style={[styles.body, { color: c.inkSoft }]}>{t('generating.body')}</Text>

        <View style={[styles.track, { backgroundColor: c.rule }]}>
          <Animated.View
            style={[styles.fill, { width: fillWidth, backgroundColor: c.thread }]}
          />
        </View>

        <Text style={[styles.estimate, { color: c.inkFaint }]}>
          {t('generating.estimate')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  center: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  title: {
    fontFamily: FONTS.serifSemibold,
    fontSize: SIZES['2xl'],
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  body: {
    fontFamily: FONTS.serifItalic,
    fontSize: SIZES.md,
    textAlign: 'center',
    lineHeight: 24,
  },
  track: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  estimate: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1,
  },
});
