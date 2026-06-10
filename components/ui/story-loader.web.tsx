import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { FONTS, SIZES } from '@/constants/colors';
import { usePalette } from '@/hooks/use-palette';

type Props = {
  title: string;
  subtitle: string;
  estimate?: string;
  notify?: string;
};

// Web stub — lottie-react-native은 @lottiefiles/dotlottie-react가 필요해 웹 번들링이 실패함.
// 웹은 사용 대상이 아니므로 ActivityIndicator로 대체.
export function StoryLoader({ title, subtitle, estimate, notify }: Props) {
  const c = usePalette();

  return (
    <View style={styles.content} accessible accessibilityRole="progressbar" accessibilityLabel={title}>
      <View style={styles.stage}>
        <ActivityIndicator size="large" color={c.thread} />
      </View>
      <Text style={[styles.title, { color: c.thread }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: c.inkSoft }]}>{subtitle}</Text>
      {estimate ? <Text style={[styles.estimate, { color: c.inkFaint }]}>{estimate}</Text> : null}
      {notify ? (
        <View style={[styles.notify, { backgroundColor: c.threadSoft ?? 'rgba(45,90,61,0.08)' }]}>
          <Text style={[styles.notifyText, { color: c.thread }]}>{`🔔  ${notify}`}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  stage: {
    width: 280,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
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
  estimate: {
    marginTop: 18,
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1,
  },
  notify: {
    marginTop: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  notifyText: {
    fontFamily: FONTS.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
});
