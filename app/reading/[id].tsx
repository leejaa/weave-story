import { useRef, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  StyleSheet,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChapterRibbon } from '@/components/chapter-ribbon';
import { TextPage } from '@/components/reading/text-page';
import { ChoicePage } from '@/components/reading/choice-page';
import { GeneratingPage } from '@/components/reading/generating-page';
import { InterventionPage } from '@/components/reading/intervention-page';
import { PaywallModal } from '@/components/ui/paywall-modal';
import { useThreadDetail } from '@/hooks/use-thread-detail';
import { usePalette } from '@/hooks/use-palette';
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
  const { data, isLoading, choosing, choose, isInsufficientCredits, clearChooseError } = useThreadDetail(id);
  const [visibleChapter, setVisibleChapter] = useState<number>(1);
  const [listHeight, setListHeight] = useState(0);

  const onListLayout = useCallback((e: LayoutChangeEvent) => {
    setListHeight(e.nativeEvent.layout.height);
  }, []);

  const handleChoose = useCallback(
    async (
      chapterNumber: number,
      selection: { choiceIndex: number } | { customInput: string },
    ) => {
      await choose(chapterNumber, selection);
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
    data.interventions ?? [],
    currentChapter,
    isCompleted,
    width,
    listHeight,
  );

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
        style={{ flex: 1 }}
        onLayout={onListLayout}
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
              <ChoicePage
                options={item.options}
                situation={item.situation}
                question={item.question}
                chapterNumber={item.chapterNumber}
                onChoose={handleChoose}
                choosing={choosing}
              />
            )}
            {item.type === 'generating' && <GeneratingPage genre={data.genre} />}
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
