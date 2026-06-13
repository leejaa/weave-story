import { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  Text,
  Alert,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChapterRibbon } from '@/components/chapter-ribbon';
import { Icon } from '@/components/ui/icon';
import { TextPage } from '@/components/reading/text-page';
import { ChoiceEntryPage } from '@/components/reading/choice-entry-page';
import { GeneratingPage } from '@/components/reading/generating-page';
import { InterventionPage } from '@/components/reading/intervention-page';
import { ChapterErrorPage } from '@/components/reading/chapter-error-page';
import { HiddenPage } from '@/components/reading/hidden-page';
import { ReportSheet } from '@/components/reading/report-sheet';
import { PaywallModal } from '@/components/ui/paywall-modal';
import { postReport, type ReportReason } from '@/lib/api/fetch';
import { shareStory } from '@/lib/share/share-story';
import { useThreadDetail } from '@/hooks/use-thread-detail';
import { usePalette } from '@/hooks/use-palette';
import { useReadingPosition } from '@/hooks/use-reading-position';
import { buildPages } from '@/lib/reading/build-pages';
import { trackChapterViewed } from '@/lib/analytics';
import { FONTS, SIZES } from '@/constants/colors';
import type { PageItem } from '@/lib/reading/types';

export default function ReadingScreen() {
  const c = usePalette();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const flatRef = useRef<FlatList>(null);

  const { t } = useTranslation('reading');
  const { data, isLoading, choosing, isInsufficientCredits, clearChooseError, retryFirstChapter, retrying } = useThreadDetail(id);
  const [visibleChapter, setVisibleChapter] = useState<number>(1);
  const [listHeight, setListHeight] = useState(0);
  const [reportVisible, setReportVisible] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const onListLayout = useCallback((e: LayoutChangeEvent) => {
    setListHeight(e.nativeEvent.layout.height);
  }, []);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: { item: PageItem; index?: number | null }[] }) => {
      const first = viewableItems[0]?.item;
      if (first && 'chapterNumber' in first) {
        setVisibleChapter(first.chapterNumber);
      }
    },
    [],
  );

  // Engagement: fire once whenever the reader lands on a new chapter.
  useEffect(() => {
    void trackChapterViewed({ chapter: visibleChapter, isFirst: visibleChapter === 1 });
  }, [visibleChapter]);

  const title = data?.title ?? '';
  const estimatedChapters = data?.estimatedChapters ?? 1;
  const currentChapter = data?.currentChapter ?? 1;
  const isCompleted = data?.status === 'completed';

  const { pages, startIndex } = data
    ? buildPages(
        data.chapters,
        data.interventions ?? [],
        currentChapter,
        isCompleted,
        width,
        listHeight,
      )
    : { pages: [], startIndex: 0 };

  const {
    initialIndex,
    isRestoring,
    handleVisiblePageChange,
    handleScrollToIndexFailed,
  } = useReadingPosition({
    threadId: id,
    pages,
    fallbackIndex: startIndex,
    listWidth: width,
    listHeight,
    listRef: flatRef,
  });

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: { item: PageItem; index?: number | null }[] }) => {
      onViewableItemsChanged({ viewableItems });
      handleVisiblePageChange(viewableItems);
    },
    [handleVisiblePageChange, onViewableItemsChanged],
  );

  if (isLoading || isRestoring) {
    return (
      <View style={[styles.container, { backgroundColor: c.paper }]}>
        <GeneratingPage />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.centered, { backgroundColor: c.paper }]}>
        <Text style={[styles.errorText, { color: c.inkSoft }]}>{t('notFound')}</Text>
      </View>
    );
  }

  // First-chapter generation failed → buildPages can't render anything (no previous
  // chapter to fall back to), so show a friendly retry screen instead of a blank page.
  const currentChapterRow = data.chapters.find(ch => ch.chapterNumber === currentChapter);
  if (currentChapter === 1 && currentChapterRow?.status === 'failed') {
    return (
      <View style={[styles.container, { backgroundColor: c.paper }]}>
        <ChapterRibbon
          title={title ?? ''}
          chapter={1}
          totalChapters={estimatedChapters}
          onBack={() => router.back()}
        />
        <ChapterErrorPage
          onRetry={retryFirstChapter}
          onBack={() => router.back()}
          retrying={retrying}
        />
      </View>
    );
  }

  // The currently visible, readable chapter — the target of a content report.
  const reportTarget = data.chapters.find(
    ch => ch.chapterNumber === visibleChapter && ch.status === 'ready' && !!ch.content,
  );

  const submitReport = async (reason: ReportReason) => {
    if (!reportTarget) return;
    setReportSubmitting(true);
    try {
      await postReport({ chapterId: reportTarget.id, reason });
      setReportVisible(false);
      Alert.alert(t('report.successTitle'), t('report.success'));
    } catch {
      Alert.alert(t('report.errorTitle'), t('report.error'));
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: c.paper }]}>
      <PaywallModal
        visible={isInsufficientCredits}
        onClose={clearChooseError}
        onSuccess={clearChooseError}
      />
      <ReportSheet
        visible={reportVisible}
        submitting={reportSubmitting}
        onClose={() => setReportVisible(false)}
        onSubmit={submitReport}
      />
      <ChapterRibbon
        title={title ?? ''}
        chapter={visibleChapter}
        totalChapters={estimatedChapters}
        onBack={() => router.back()}
        onReport={reportTarget ? () => setReportVisible(true) : undefined}
        onShare={() => shareStory({ title, threadId: id })}
      />

      <FlatList
        ref={flatRef}
        data={pages}
        keyExtractor={item => item.key}
        style={styles.readerList}
        onLayout={onListLayout}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        initialScrollIndex={initialIndex}
        scrollEnabled={!choosing}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={{ width, height: listHeight || undefined, overflow: 'hidden' }}>
            {item.type === 'text' && (
              <TextPage
                content={item.content}
                chapterTitle={item.pageIndex === 0 ? item.chapterTitle : null}
                pageIndex={item.pageIndex}
                totalPages={item.totalPages}
              />
            )}
            {item.type === 'choice' && (
              <ChoiceEntryPage
                situation={item.situation}
                question={item.question}
                onOpen={() => {
                  router.push({
                    pathname: '/reading-choice/[id]',
                    params: { id, chapterNumber: String(item.chapterNumber) },
                  });
                }}
              />
            )}
            {item.type === 'generating' && <GeneratingPage />}
            {item.type === 'hidden' && <HiddenPage />}
            {item.type === 'intervention' && <InterventionPage text={item.text} />}
            {item.type === 'end' && (
              <View style={styles.centered}>
                <Text style={[styles.endMark, { color: c.inkFaint }]}>{t('end')}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => shareStory({ title, threadId: id })}
                  style={({ pressed }) => [styles.endShare, { borderColor: c.rule, opacity: pressed ? 0.7 : 1 }]}>
                  <Icon name="share" size={15} color={c.inkSoft} />
                  <Text style={[styles.endShareText, { color: c.inkSoft }]}>{t('share.cta')}</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  readerList: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: {
    fontFamily: FONTS.serifItalic,
    fontSize: SIZES.lg,
    textAlign: 'center',
    lineHeight: 28,
  },
  endMark: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.sm,
    letterSpacing: 2,
  },
  endShare: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 28,
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 999,
  },
  endShareText: {
    fontFamily: FONTS.sansMedium,
    fontSize: SIZES.sm,
  },
});
