import { StyleSheet, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { FONTS, SIZES } from '@/constants/colors';
import { usePalette } from '@/hooks/use-palette';
import { StoryLoaderAmbient } from './story-loader-ambient';

const STORY_BOOK_BIRTH_LOADER = require('@/assets/animations/story-book-birth-loader.json');

const TITLE_SIZE = SIZES.xl;
const TITLE_LINE_HEIGHT = 30;

type Props = {
  title: string;
  subtitle: string;
  estimate?: string;
  notify?: string;
};

export function StoryLoader({ title, subtitle, estimate, notify }: Props) {
  const c = usePalette();

  return (
    <View style={styles.content} accessible accessibilityRole="progressbar" accessibilityLabel={title}>
      <View style={styles.stage}>
        <StoryLoaderAmbient />
        <LottieView source={STORY_BOOK_BIRTH_LOADER} autoPlay loop style={styles.animation} />
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
  animation: {
    width: 258,
    height: 194,
  },
  title: {
    fontFamily: FONTS.cover,
    fontSize: TITLE_SIZE,
    lineHeight: TITLE_LINE_HEIGHT,
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
