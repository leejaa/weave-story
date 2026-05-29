import { Text, StyleSheet, View } from 'react-native';
import { FONTS } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';

type Props = {
  chapter: number;
  totalChapters: number;
  colors: ThemeColors;
};

export function ChapterBookmarkLabel({ chapter, totalChapters, colors }: Props) {
  return (
    <View
      style={[
        styles.bookmark,
        {
          backgroundColor: colors.paperRaised,
          borderColor: colors.rule,
        },
      ]}>
      <Text style={[styles.eyebrow, { color: colors.inkFaint }]}>CHAPTER</Text>
      <Text style={[styles.count, { color: colors.ink }]}>
        {String(chapter).padStart(2, '0')} / {String(totalChapters).padStart(2, '0')}
      </Text>
      <View style={[styles.tail, { borderTopColor: colors.paperRaised }]} />
      <View style={[styles.tailBorder, { borderTopColor: colors.rule }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  bookmark: {
    position: 'relative',
    minWidth: 72,
    paddingHorizontal: 10,
    paddingTop: 7,
    paddingBottom: 9,
    borderWidth: 1,
    borderRadius: 7,
    alignItems: 'center',
    gap: 1,
  },
  eyebrow: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    letterSpacing: 0,
  },
  count: {
    fontFamily: FONTS.serifSemibold,
    fontSize: 12,
    letterSpacing: 0,
  },
  tail: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: -7,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    zIndex: 2,
  },
  tailBorder: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    zIndex: 1,
  },
});
