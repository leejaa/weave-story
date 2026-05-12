import { useCallback, useState } from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StoryCard } from '@/components/story-card';
import { usePalette } from '@/hooks/use-palette';
import { useStories } from '@/hooks/use-stories';
import { useThreads } from '@/hooks/use-threads';
import { authFetch } from '@/lib/auth/client/api';
import { FONTS, SIZES } from '@/constants/colors';

type Period = 'morning' | 'afternoon' | 'evening';

function getDayPeriod(): { weekday: string; period: Period } {
  const h = new Date().getHours();
  const weekday = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const period: Period = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  return { weekday, period };
}

export default function HomeScreen() {
  const c = usePalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('home');
  const { stories, loading: storiesLoading } = useStories();
  const { threads } = useThreads();

  const { weekday, period } = getDayPeriod();
  const [openingStoryId, setOpeningStoryId] = useState<string | null>(null);

  const openStory = useCallback(
    async (storyId: string) => {
      const existing = threads.find(th => th.storyId === storyId);
      if (existing) {
        router.push(`/reading/${existing.threadId}`);
        return;
      }
      setOpeningStoryId(storyId);
      try {
        const res = await authFetch('/api/threads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storyId }),
        });
        const thread = await res.json();
        router.push(`/reading/${thread.id}`);
      } finally {
        setOpeningStoryId(null);
      }
    },
    [threads, router],
  );

  const activeThread = threads.find(th => th.status === 'active');
  const featuredStories = stories.slice(0, 2);
  const moreStories = stories.slice(2);

  return (
    <ScrollView
      style={{ backgroundColor: c.paper }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 130 }]}
      showsVerticalScrollIndicator={false}>

      {/* Greeting */}
      <View style={styles.section}>
        <Text style={[styles.eyebrow, { color: c.inkFaint }]}>
          {weekday} · {t(`period.${period}`)}
        </Text>
        <Text style={[styles.greeting, { color: c.ink }]}>{t(`greeting.${period}`)}</Text>
        <Text style={[styles.subtitle, { color: c.inkSoft }]}>{t('lastThread')}</Text>
      </View>

      {/* Continue reading */}
      {activeThread && (
        <View style={styles.section}>
          <Pressable
            onPress={() => openStory(activeThread.storyId)}
            style={({ pressed }) => [
              styles.continueCard,
              { backgroundColor: c.paperRaised, shadowColor: c.ink },
              pressed && styles.pressed,
            ]}>
            <View style={[styles.continueCover, { backgroundColor: c.paperSunk }]}>
              {activeThread.coverImageUrl ? (
                <Image
                  source={{ uri: activeThread.coverImageUrl }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={200}
                />
              ) : null}
              <View style={styles.continueScrim} />
            </View>
            <View style={styles.continueBody}>
              <View>
                <Text style={[styles.mono, { color: c.inkFaint }]}>
                  {t('chapter', { chapter: String(activeThread.currentChapter).padStart(2, '0'), beat: '01' })}
                </Text>
                <Text style={[styles.continueTitle, { color: c.ink }]}>{activeThread.title}</Text>
                <Text style={[styles.continueExcerpt, { color: c.inkSoft }]} numberOfLines={2}>
                  {activeThread.description}
                </Text>
              </View>
              <View style={styles.progressRow}>
                <View style={[styles.progressTrack, { backgroundColor: c.rule, flex: 1 }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.round(parseFloat(activeThread.progress) * 100)}%` as any, backgroundColor: c.thread },
                    ]}
                  />
                </View>
                <Text style={[styles.mono, { color: c.inkFaint }]}>
                  {t('progress', { percent: Math.round(parseFloat(activeThread.progress) * 100) })}
                </Text>
              </View>
            </View>
          </Pressable>
        </View>
      )}

      {/* Featured stories */}
      {storiesLoading ? (
        <ActivityIndicator color={c.thread} style={{ marginTop: 24 }} />
      ) : featuredStories.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.ink }]}>{t('woven')}</Text>
            <Text style={[styles.seeAll, { color: c.thread }]}>{t('seeAll')}</Text>
          </View>
          <View style={styles.grid}>
            {featuredStories.map(story => (
              <View key={story.id} style={styles.gridCell}>
                <StoryCard
                  title={story.title}
                  mood={story.mood}
                  chapters={story.estimatedChapters}
                  progress={0}
                  coverImageUrl={story.coverImageUrl}
                  onPress={() => openStory(story.id)}
                />
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* More stories */}
      {moreStories.length > 0 && (
        <View>
          <Text style={[styles.sectionTitle, { color: c.ink, paddingHorizontal: 20, marginBottom: 12 }]}>
            {t('slowBurns')}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}>
            {moreStories.map(story => (
              <View key={story.id} style={styles.horizontalCard}>
                <StoryCard
                  title={story.title}
                  mood={story.mood}
                  chapters={story.estimatedChapters}
                  progress={0}
                  coverImageUrl={story.coverImageUrl}
                  onPress={() => openStory(story.id)}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 0 },
  section: { padding: 20, paddingBottom: 8 },
  eyebrow: {
    fontFamily: FONTS.sansSemibold,
    fontSize: SIZES['2xs'],
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  greeting: {
    fontFamily: FONTS.serifSemibold,
    fontSize: SIZES['3xl'],
    letterSpacing: -0.4,
    lineHeight: 38,
    marginTop: 4,
  },
  subtitle: {
    fontFamily: FONTS.serifItalic,
    fontSize: SIZES.lg,
    marginTop: 6,
    lineHeight: 24,
  },
  continueCard: {
    flexDirection: 'row',
    gap: 14,
    padding: 14,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  continueCover: {
    width: 78,
    aspectRatio: 3 / 4,
    borderRadius: 10,
    overflow: 'hidden',
    flexShrink: 0,
  },
  continueScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  continueBody: { flex: 1, justifyContent: 'space-between' },
  mono: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 0.5 },
  continueTitle: {
    fontFamily: FONTS.serifSemibold,
    fontSize: SIZES.lg,
    marginTop: 2,
    lineHeight: 22,
  },
  continueExcerpt: {
    fontFamily: FONTS.serifItalic,
    fontSize: SIZES.sm,
    marginTop: 4,
    lineHeight: 18,
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTrack: { height: 2, borderRadius: 1, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 1 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  sectionTitle: { fontFamily: FONTS.serifSemibold, fontSize: SIZES.xl },
  seeAll: { fontFamily: FONTS.sans, fontSize: SIZES.xs },
  grid: { flexDirection: 'row', gap: 12 },
  gridCell: { flex: 1 },
  horizontalScroll: { gap: 12, paddingHorizontal: 20, paddingBottom: 6 },
  horizontalCard: { width: 130 },
});
