import { View, Text, Pressable, StyleSheet } from 'react-native';
import { usePalette } from '@/hooks/use-palette';
import { Icon } from '@/components/ui/icon';
import { FONTS, SIZES } from '@/constants/colors';

type Props = {
  title: string;
  chapter: number;
  beat: number;
  totalBeats: number;
  onBack?: () => void;
};

export function ChapterRibbon({ title, chapter, beat, totalBeats, onBack }: Props) {
  const c = usePalette();

  return (
    <View style={[styles.ribbon, { backgroundColor: c.paper, borderBottomColor: c.rule }]}>
      <Pressable
        onPress={onBack}
        style={[styles.backButton, { borderColor: c.rule, backgroundColor: c.paper }]}>
        <Icon name="chevron-left" size={16} color={c.inkSoft} />
      </Pressable>

      <View style={styles.titleBlock}>
        <Text style={[styles.title, { color: c.ink }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.position, { color: c.inkFaint }]}>
          CH. {String(chapter).padStart(2, '0')} · BEAT {String(beat).padStart(2, '0')}
        </Text>
      </View>

      <View style={styles.dots}>
        {Array.from({ length: totalBeats }).map((_, i) => {
          const done = i < beat - 1;
          const current = i === beat - 1;
          return (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: done || current ? c.thread : c.ruleStrong,
                  shadowColor: current ? c.threadSoft : 'transparent',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: current ? 1 : 0,
                  shadowRadius: current ? 4 : 0,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ribbon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
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
    fontSize: 9,
    letterSpacing: 0.5,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
