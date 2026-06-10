import { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookShelf } from '@/components/home/book-shelf';
import { BookExpandTransition } from '@/components/home/book-expand-transition';
import { useBookSelection, type BookOrigin } from '@/components/home/use-book-selection';
import type { SampleCardData } from '@/lib/api/types';

export default function CreateScreen() {
  const { t } = useTranslation('home');
  const router = useRouter();
  const { selectedCard, origin, selectBook, clearSelection } = useBookSelection();

  const handleCardSelected = useCallback(
    (card: SampleCardData, cardOrigin: BookOrigin) => {
      selectBook(card, cardOrigin);
    },
    [selectBook],
  );

  const handleExpandFinish = useCallback(() => {
    if (!selectedCard) return;

    const pool = selectedCard.prompts?.length > 0 ? selectedCard.prompts : [selectedCard.prompt];
    const randomPrompt = pool[Math.floor(Math.random() * pool.length)];

    // (modal) 스택의 book-preview로 이동 — animation:'none'이므로 즉시 마운트됨
    router.push({
      pathname: '/book-preview',
      params: {
        id: selectedCard.id,
        genre: selectedCard.genre,
        genreLabel: selectedCard.genreLabel,
        title: selectedCard.title,
        color: selectedCard.color,
        imageUrl: selectedCard.imageUrl ?? '',
        prompt: randomPrompt,
        displayOrder: String(selectedCard.displayOrder),
      },
    });

    // 모달이 위에 덮여있으므로 overlay 제거는 사용자에게 보이지 않음.
    // 400ms 지연 → 모달이 안착된 후 조용히 정리.
    setTimeout(clearSelection, 400);
  }, [clearSelection, router, selectedCard]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.inner}>
        <BookShelf
          headline={t('hero.headline')}
          selectedCardId={selectedCard?.id ?? null}
          onCardSelected={handleCardSelected}
        />
      </View>

      {/* 카드 확대 전환 overlay — SafeAreaView 내부에서 절대 위치로 렌더 */}
      <BookExpandTransition
        card={selectedCard}
        origin={origin}
        isVisible={!!selectedCard && !!origin}
        onFinish={handleExpandFinish}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f5f0e8',
  },
  inner: {
    flex: 1,
  },
});
