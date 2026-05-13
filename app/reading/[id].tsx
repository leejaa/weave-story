import { useRef, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChapterRibbon } from '@/components/chapter-ribbon';
import { TextPage } from '@/components/reading/text-page';
import { ChoicePage } from '@/components/reading/choice-page';
import { GeneratingPage } from '@/components/reading/generating-page';
import { useThreadDetail } from '@/hooks/use-thread-detail';
import { usePalette } from '@/hooks/use-palette';
import { calcCharsPerPage, paginateText } from '@/lib/reading/paginate';
import { FONTS, SIZES } from '@/constants/colors';
import type { Chapter, ChapterOption } from '@/lib/api/types';

// ─── Page types ──────────────────────────────────────────────────────────────

type TextPageItem = {
  key: string; type: 'text';
  chapterNumber: number;
  content: string; pageIndex: number; totalPages: number;
  chapterTitle: string | null;
};
type ChoicePageItem = {
  key: string; type: 'choice';
  chapterNumber: number;
  options: ChapterOption[];
  situation: string | null;
  question: string | null;
};
type GeneratingPageItem = { key: string; type: 'generating'; chapterNumber: number };
type FailedPageItem    = { key: string; type: 'failed';     chapterNumber: number };
type EndPageItem       = { key: string; type: 'end' };

type PageItem = TextPageItem | ChoicePageItem | GeneratingPageItem | FailedPageItem | EndPageItem;

// ─── Page builder ─────────────────────────────────────────────────────────────

function buildPages(
  allChapters: Chapter[],
  currentChapterNumber: number,
  isCompleted: boolean,
  width: number,
  height: number,
): { pages: PageItem[]; startIndex: number } {
  const pages: PageItem[] = [];
  let startIndex = 0;

  for (const ch of allChapters) {
    const isCurrentChapter = ch.chapterNumber === currentChapterNumber;

    if (isCurrentChapter) startIndex = pages.length;

    if (ch.status === 'generating') {
      pages.push({ key: `ch${ch.chapterNumber}-gen`, type: 'generating', chapterNumber: ch.chapterNumber });
      continue;
    }

    if (ch.status === 'failed') {
      pages.push({ key: `ch${ch.chapterNumber}-fail`, type: 'failed', chapterNumber: ch.chapterNumber });
      continue;
    }

    if (!ch.content) continue;

    const charsFirst = calcCharsPerPage(width, height, true);
    const charsRest  = calcCharsPerPage(width, height, false);
    const textPages  = paginateText(ch.content, charsFirst, charsRest);

    textPages.forEach((content, i) => {
      pages.push({
        key: `ch${ch.chapterNumber}-p${i}`,
        type: 'text',
        chapterNumber: ch.chapterNumber,
        content,
        pageIndex: i,
        totalPages: textPages.length,
        chapterTitle: ch.title,
      });
    });

    // Choice page: only for the current chapter (past choices can't be re-made)
    if (isCurrentChapter && ch.options && (ch.options as ChapterOption[]).length > 0) {
      pages.push({
        key: `ch${ch.chapterNumber}-choice`,
        type: 'choice',
        chapterNumber: ch.chapterNumber,
        options: ch.options as ChapterOption[],
        situation: ch.situation ?? null,
        question: ch.question ?? null,
      });
    }
  }

  if (isCompleted && pages[pages.length - 1]?.type !== 'end') {
    pages.push({ key: 'end', type: 'end' });
  }

  return { pages, startIndex };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ReadingScreen() {
  const c = usePalette();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width, height } = useWindowDimensions();
  const flatRef = useRef<FlatList>(null);

  const { t } = useTranslation('reading');
  const { data, isLoading, choosing, choose } = useThreadDetail(id);
  const [visibleChapter, setVisibleChapter] = useState<number>(1);

  const handleChoose = useCallback(
    async (
      chapterNumber: number,
      selection: { choiceIndex: number } | { customInput: string },
    ) => {
      await choose(chapterNumber, selection);
      // After state updates, FlatList re-renders with the generating page appended
    },
    [choose],
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ item: PageItem }> }) => {
      const first = viewableItems[0]?.item;
      if (first && 'chapterNumber' in first) {
        setVisibleChapter(first.chapterNumber);
      }
    },
    [],
  );

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: c.paper }]}>
        <ActivityIndicator color={c.thread} />
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

  const { title, estimatedChapters, currentChapter } = data;
  const isCompleted = data.status === 'completed';

  const { pages, startIndex } = buildPages(
    data.chapters,
    currentChapter,
    isCompleted,
    width,
    height,
  );

  return (
    <View style={[styles.container, { backgroundColor: c.paper }]}>
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
        style={{ flex: 1 }}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        initialScrollIndex={startIndex}
        scrollEnabled={!choosing}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={[styles.page, { width }]}>
            {item.type === 'text' && (
              <TextPage
                content={item.content}
                chapterTitle={item.pageIndex === 0 ? item.chapterTitle : null}
                pageIndex={item.pageIndex}
                totalPages={item.totalPages}
              />
            )}
            {item.type === 'choice' && (
              <ChoicePage
                options={item.options}
                situation={item.situation}
                question={item.question}
                chapterNumber={item.chapterNumber}
                onChoose={handleChoose}
                choosing={choosing}
              />
            )}
            {item.type === 'generating' && <GeneratingPage />}
            {item.type === 'failed' && (
              <View style={styles.centered}>
                <Text style={[styles.errorText, { color: c.inkSoft }]}>{t('chapterFailed')}</Text>
              </View>
            )}
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: {
    fontFamily: FONTS.serifItalic,
    fontSize: SIZES.lg,
    textAlign: 'center',
    lineHeight: 28,
  },
  page: { flex: 1 },
  endMark: {
    fontFamily: FONTS.mono,
    fontSize: SIZES.sm,
    letterSpacing: 2,
  },
});
