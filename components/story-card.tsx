import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { usePalette } from '@/hooks/use-palette';
import { FONTS, SIZES } from '@/constants/colors';
import type { ThreadWithStory } from '@/lib/api/types';

type Props = {
  thread: ThreadWithStory;
  onPress: () => void;
  width: number;
};

export function StoryCard({ thread, onPress, width }: Props) {
  const c = usePalette();
  const { t } = useTranslation('common');
  const progress = parseFloat(thread.progress);
  const finished = thread.status === 'completed';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { width, shadowColor: c.ink },
        pressed && styles.pressed,
      ]}>

      {/* Cover */}
      <View style={[styles.cover, { width, aspectRatio: 3 / 4, backgroundColor: c.paperSunk }]}>
        {thread.coverImageUrl ? (
          <Image
            source={{ uri: thread.coverImageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={400}
          />
        ) : null}

        {/* Gradient scrim + title overlay */}
        <View style={styles.scrim}>
          {SCRIM_STOPS.map((opacity, i) => (
            <View key={i} style={[styles.scrimSlice, { backgroundColor: `rgba(0,0,0,${opacity})` }]} />
          ))}
        </View>
        <Text style={styles.coverTitle} numberOfLines={2}>
          {thread.title ?? ''}
        </Text>

        {/* Progress bar pinned to bottom edge */}
        {!finished && (
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.round(progress * 100)}%` as any, backgroundColor: c.thread },
              ]}
            />
          </View>
        )}

        {/* Completed badge */}
        {finished && (
          <View style={[styles.badge, { backgroundColor: c.thread }]}>
            <Text style={[styles.badgeLabel, { color: c.paper }]}>
              {t('status.completed')}
            </Text>
          </View>
        )}
      </View>

      {/* Meta row */}
      <View style={[styles.meta, { backgroundColor: c.paperRaised }]}>
        <Text style={[styles.genre, { color: c.inkFaint }]} numberOfLines={1}>
          {thread.genre ?? thread.mood ?? ''}
        </Text>
        {!finished && (
          <Text style={[styles.chapter, { color: c.inkFaint }]}>
            {thread.currentChapter} / {thread.estimatedChapters}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

// Stepped gradient stops for a natural-looking scrim
const SCRIM_STOPS = [0, 0.01, 0.04, 0.09, 0.16, 0.25, 0.36, 0.46];

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.97 }] },
  cover: {
    overflow: 'hidden',
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  scrimSlice: { flex: 1 },
  coverTitle: {
    position: 'absolute',
    bottom: 16,
    left: 10,
    right: 10,
    fontFamily: FONTS.serifSemibold,
    fontSize: SIZES.sm,
    color: '#ffffff',
    lineHeight: 20,
  },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  progressFill: { height: '100%' },
  badge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeLabel: {
    fontFamily: FONTS.sansSemibold,
    fontSize: SIZES['2xs'],
    letterSpacing: 0.3,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  genre: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    flex: 1,
  },
  chapter: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 0.5,
  },
});
