import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { usePalette } from '@/hooks/use-palette';
import { FONTS, SIZES } from '@/constants/colors';
import type { ThreadWithStory } from '@/lib/api/types';

type Props = {
  thread: ThreadWithStory;
  onPress: () => void;
};

export function ThreadRow({ thread, onPress }: Props) {
  const c = usePalette();
  const progress = parseFloat(thread.progress);
  const finished = thread.status === 'completed';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: c.paperRaised, shadowColor: c.ink },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.cover, { backgroundColor: c.paperSunk }]}>
        {thread.coverImageUrl ? (
          <Image
            source={{ uri: thread.coverImageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
          />
        ) : null}
      </View>
      <View style={styles.body}>
        <View style={styles.meta}>
          <Text style={[styles.genre, { color: c.inkFaint }]}>{thread.mood}</Text>
          {!finished && (
            <Text style={[styles.chapterTag, { color: c.inkFaint }]}>Ch.{thread.currentChapter}</Text>
          )}
          {finished && (
            <Text style={[styles.finishedTag, { color: c.thread }]}>완결</Text>
          )}
        </View>
        <Text style={[styles.title, { color: c.ink }]} numberOfLines={1}>{thread.title}</Text>
        {thread.description ? (
          <Text style={[styles.excerpt, { color: c.inkSoft }]} numberOfLines={1}>
            {thread.description}
          </Text>
        ) : null}
        {!finished && (
          <View style={styles.progressRow}>
            <View style={[styles.progressTrack, { backgroundColor: c.rule }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round(progress * 100)}%` as any, backgroundColor: c.thread },
                ]}
              />
            </View>
            <Text style={[styles.progressLabel, { color: c.inkFaint }]}>{Math.round(progress * 100)}%</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 14,
    padding: 14,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  cover: {
    width: 56,
    aspectRatio: 3 / 4,
    borderRadius: 8,
    flexShrink: 0,
    overflow: 'hidden',
  },
  body: { flex: 1, justifyContent: 'space-between' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  genre: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 0.5 },
  chapterTag: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 0.5 },
  finishedTag: { fontFamily: FONTS.sansMedium, fontSize: 10, letterSpacing: 0.5 },
  title: { fontFamily: FONTS.serifSemibold, fontSize: SIZES.md, marginTop: 2 },
  excerpt: {
    fontFamily: FONTS.serifItalic,
    fontSize: SIZES.sm,
    marginTop: 3,
    lineHeight: 18,
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  progressTrack: { flex: 1, height: 2, borderRadius: 1, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 1 },
  progressLabel: { fontFamily: FONTS.mono, fontSize: 10 },
});
