import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import LottieView from 'lottie-react-native';
import { FONTS, SIZES } from '@/constants/colors';
import { usePalette } from '@/hooks/use-palette';

const STORY_WRITING_LOADER = require('@/assets/animations/story-writing-loader.json');

type Props = {
  title: string;
  subtitle: string;
};

export function StoryWritingLoadingOverlay({ title, subtitle }: Props) {
  const c = usePalette();
  const isDark = useColorScheme() === 'dark';

  return (
    <View
      style={[styles.backdrop, { backgroundColor: isDark ? 'rgba(19,23,16,0.88)' : 'rgba(255,248,232,0.76)' }]}
      pointerEvents="auto">
      <View
        style={[styles.panel, { backgroundColor: isDark ? 'rgba(35,43,31,0.92)' : 'rgba(255,251,242,0.72)' }]}
        accessible accessibilityRole="progressbar" accessibilityLabel={title}>
        <LottieView
          source={STORY_WRITING_LOADER}
          autoPlay
          loop
          style={styles.animation}
        />
        <Text style={[styles.title, { color: c.ink }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: c.inkSoft }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34,
  },
  panel: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 26,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(92,71,45,0.18)',
  },
  animation: {
    width: 210,
    height: 158,
    marginBottom: 4,
  },
  title: {
    fontFamily: FONTS.cover,
    fontSize: SIZES.xl,
    lineHeight: 30,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontFamily: FONTS.serifItalic,
    fontSize: SIZES.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
});
