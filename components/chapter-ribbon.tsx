import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { usePalette } from '@/hooks/use-palette';
import { Icon } from '@/components/ui/icon';
import { ChapterBookmarkLabel } from '@/components/reading/chapter-bookmark-label';
import { ChapterProgressLine } from '@/components/reading/chapter-progress-line';
import { FONTS, SIZES } from '@/constants/colors';

type Props = {
  title: string;
  chapterTitle?: string | null;
  chapter: number;
  totalChapters: number;
  onBack?: () => void;
  onReport?: () => void;
};

export function ChapterRibbon({ title, chapterTitle, chapter, totalChapters, onBack, onReport }: Props) {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('reading');
  const { t: tc } = useTranslation('common');

  return (
    <View style={[styles.ribbon, { backgroundColor: c.paper, borderBottomColor: c.rule, paddingTop: insets.top + 10 }]}>
      <View style={styles.topRow}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={tc('a11y.back')}
          style={[styles.backButton, { borderColor: c.rule, backgroundColor: c.paperRaised }]}>
          <Icon name="chevron-left" size={16} color={c.inkSoft} />
        </Pressable>

        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: c.ink }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.position, { color: c.inkFaint }]} numberOfLines={1}>
            {chapterTitle?.trim() || t('nowReading')}
          </Text>
        </View>

        {onReport ? (
          <Pressable
            onPress={onReport}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={tc('a11y.report')}
            style={[styles.reportButton, { borderColor: c.rule, backgroundColor: c.paperRaised }]}>
            <Icon name="flag" size={15} color={c.inkFaint} />
          </Pressable>
        ) : null}

        <ChapterBookmarkLabel chapter={chapter} totalChapters={totalChapters} colors={c} />
      </View>

      <ChapterProgressLine chapter={chapter} totalChapters={totalChapters} colors={c} />
    </View>
  );
}

const styles = StyleSheet.create({
  ribbon: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontFamily: FONTS.serifSemibold,
    fontSize: SIZES.sm,
  },
  position: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 0,
  },
});
