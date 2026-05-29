import { StyleSheet, View } from 'react-native';
import type { ThemeColors } from '@/constants/colors';

type Props = {
  chapter: number;
  totalChapters: number;
  colors: ThemeColors;
};

export function ChapterProgressLine({ chapter, totalChapters, colors }: Props) {
  const progress = Math.max(0, Math.min(1, chapter / Math.max(totalChapters, 1)));

  return (
    <View style={[styles.track, { backgroundColor: colors.rule }]}>
      <View
        style={[
          styles.fill,
          {
            backgroundColor: colors.thread,
            width: `${progress * 100}%`,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    height: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
