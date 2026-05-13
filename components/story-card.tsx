import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { usePalette } from '@/hooks/use-palette';
import { FONTS, SIZES } from '@/constants/colors';

type Props = {
  title: string;
  mood: string;
  chapters: number;
  progress: number;
  coverImageUrl?: string | null;
  coverColor?: string;
  onPress?: () => void;
};

const SCRIM_STOPS = [0, 0.02, 0.06, 0.12, 0.20, 0.30, 0.40, 0.48];

export function StoryCard({ title, mood, chapters, progress, coverImageUrl, coverColor, onPress }: Props) {
  const c = usePalette();
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.card,
        { backgroundColor: c.paperRaised },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.cover, { backgroundColor: coverColor ?? c.paperSunk }]}>
        {coverImageUrl ? (
          <Image
            source={{ uri: coverImageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
          />
        ) : null}
        <View style={styles.coverScrim}>
          {SCRIM_STOPS.map((opacity, i) => (
            <View key={i} style={[styles.scrimLayer, { backgroundColor: `rgba(0,0,0,${opacity})` }]} />
          ))}
        </View>
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
  },
  scrimLayer: { flex: 1 },
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
