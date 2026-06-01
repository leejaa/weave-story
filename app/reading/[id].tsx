import { useRef, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChapterRibbon } from '@/components/chapter-ribbon';
import { TextPage } from '@/components/reading/text-page';
import { ChoiceEntryPage } from '@/components/reading/choice-entry-page';
import { GeneratingPage } from '@/components/reading/generating-page';
import { InterventionPage } from '@/components/reading/intervention-page';
import { PaywallModal } from '@/components/ui/paywall-modal';
import { useThreadDetail } from '@/hooks/use-thread-detail';
import { usePalette } from '@/hooks/use-palette';
import { useReadingPosition } from '@/hooks/use-reading-position';
import { buildPages } from '@/lib/reading/build-pages';
import { FONTS, SIZES } from '@/constants/colors';
import type { PageItem } from '@/lib/reading/types';

export default function ReadingScreen() {
  const c = usePalette();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const flatRef = useRef<FlatList>(null);

  const { t } = useTranslation('reading');
  const { data, isLoading, choosing, isInsufficientCredits, clearChooseError } = useThreadDetail(id);
  const [visibleChapter, setVisibleChapter] = useState<number>(1);
  const [listHeight, setListHeight] = useState(0);

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

  return (
    <View style={[styles.container, { backgroundColor: c.paper }]}>
      <PaywallModal
        visible={isInsufficientCredits}
        onClose={clearChooseError}
        onSuccess={clearChooseError}
      />
      <ChapterRibbon
        title={title ?? ''}
        chapter={visibleChapter}
        totalChapters={estimatedChapters}
        onBack={() => router.back()}
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
            {item.type === 'intervention' && <InterventionPage text={item.text} />}
            {item.type === 'end' && (
              <View style={styles.centered}>
                <Text style={[styles.endMark, { color: c.inkFaint }]}>{t('end')}</Text>
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
});
