import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { FONTS, SIZES } from '@/constants/colors';
import { usePalette } from '@/hooks/use-palette';

type Props = {
  title: string;
  subtitle: string;
};

// Web stub — lottie-react-native 웹 번들링 오류 방지용.
export function StoryWritingLoadingOverlay({ title, subtitle }: Props) {
  const c = usePalette();

  return (
    <View style={styles.backdrop} pointerEvents="auto">
      <View style={styles.panel} accessible accessibilityRole="progressbar" accessibilityLabel={title}>
        <ActivityIndicator size="large" color={c.ink} style={styles.animation} />
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
    backgroundColor: 'rgba(255,248,232,0.76)',
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
    backgroundColor: 'rgba(255,251,242,0.72)',
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
