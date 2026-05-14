import { ScrollView, View, Text, ActivityIndicator, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { usePalette } from '@/hooks/use-palette';
import { useThreads } from '@/hooks/use-threads';
import { StoryCard } from '@/components/story-card';
import { FONTS, SIZES } from '@/constants/colors';


const H_PADDING = 20;
const GRID_GAP = 12;

export default function StoriesScreen() {
  const c = usePalette();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { t } = useTranslation('library');
  const { data: threads = [], isLoading } = useThreads();

  const cardWidth = (width - H_PADDING * 2 - GRID_GAP) / 2;
  const ready   = threads.filter(th => th.title !== null);
  const ongoing = ready.filter(th => th.status !== 'completed');
  const finished = ready.filter(th => th.status === 'completed');
  const showSections = ongoing.length > 0 && finished.length > 0;

  const openThread = (threadId: string) => router.push(`/reading/${threadId}`);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.paper }} edges={['top']}>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.content, { paddingBottom: 130 }]}
      showsVerticalScrollIndicator={false}>

      <Text style={[styles.screenTitle, { color: c.ink }]}>{t('screenTitle')}</Text>

      {isLoading ? (
        <ActivityIndicator color={c.thread} style={{ marginTop: 24 }} />
      ) : threads.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: c.inkSoft }]}>{t('empty.stories.title')}</Text>
          <Text style={[styles.emptySubtitle, { color: c.inkFaint }]}>{t('empty.stories.subtitle')}</Text>
        </View>
      ) : (
        <>
          {showSections && ongoing.length > 0 && (
            <Text style={[styles.sectionLabel, { color: c.inkFaint }]}>{t('section.ongoing')}</Text>
          )}
          {ongoing.length > 0 && (
            <View style={styles.grid}>
              {ongoing.map(thread => (
                <StoryCard
                  key={thread.threadId}
                  thread={thread}
                  width={cardWidth}
                  onPress={() => openThread(thread.threadId)}
                />
              ))}
            </View>
          )}

          {showSections && finished.length > 0 && (
            <Text style={[styles.sectionLabel, { color: c.inkFaint, marginTop: 28 }]}>
              {t('section.completed')}
            </Text>
          )}
          {finished.length > 0 && (
            <View style={styles.grid}>
              {finished.map(thread => (
                <StoryCard
                  key={thread.threadId}
                  thread={thread}
                  width={cardWidth}
                  onPress={() => openThread(thread.threadId)}
                />
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: H_PADDING },
  screenTitle: {
    fontFamily: FONTS.serifSemibold,
    fontSize: SIZES['3xl'],
    marginBottom: 20,
  },
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  empty: { marginTop: 60, alignItems: 'center', gap: 8 },
  emptyTitle: { fontFamily: FONTS.serifSemibold, fontSize: SIZES.lg },
  emptySubtitle: { fontFamily: FONTS.serifItalic, fontSize: SIZES.sm, textAlign: 'center', lineHeight: 20 },
});
