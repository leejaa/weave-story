import { View, Text, Pressable, StyleSheet } from 'react-native';
import { usePalette } from '@/hooks/use-palette';
import { FONTS, SIZES } from '@/constants/colors';

type Props = {
  title: string;
  mood: string;
  chapters: number;
  progress: number;
  coverColor: string;
  onPress?: () => void;
};

export function StoryCard({ title, mood, chapters, progress, coverColor, onPress }: Props) {
  const c = usePalette();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: c.paperRaised },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.cover, { backgroundColor: coverColor }]}>
        <View style={styles.coverScrim} />
        <Text style={styles.coverTitle} numberOfLines={2}>{title}</Text>
      </View>
      <View style={styles.meta}>
        <Text style={[styles.metaText, { color: c.inkSoft }]}>
          {mood} · {chapters} ch
        </Text>
        <View style={[styles.progressTrack, { backgroundColor: c.rule }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.round(progress * 100)}%` as any, backgroundColor: c.thread },
            ]}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#1c1a17',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  cover: {
    aspectRatio: 3 / 4,
    justifyContent: 'flex-end',
    padding: 10,
  },
  coverScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  coverTitle: {
    fontFamily: FONTS.serifSemibold,
    fontSize: SIZES.sm,
    color: '#fff',
    lineHeight: 18,
  },
  meta: {
    padding: 10,
    paddingTop: 8,
    gap: 6,
  },
  metaText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  progressTrack: {
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1,
  },
});
