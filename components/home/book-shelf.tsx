import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useLocalizedSampleCards } from '@/hooks/use-localized-sample-cards';
import { BookCoverGallery } from './book-cover-gallery';
import { BookLaunchTransition } from './book-launch-transition';
import type { SampleCardData } from '@/lib/api/types';
import { useBookSelection, type BookOrigin } from './use-book-selection';

type Props = {
  headline: string;
};

export function BookShelf({ headline }: Props) {
  const router = useRouter();
  const { data: cards = [], isLoading } = useLocalizedSampleCards();
  const { selectedCard, origin, selectBook, clearSelection } = useBookSelection();

  const handleBookPress = useCallback(
    (card: SampleCardData, bookOrigin: BookOrigin) => {
      selectBook(card, bookOrigin);
    },
    [selectBook],
  );

  const handleLaunchFinish = useCallback(() => {
    if (!selectedCard) return;

    router.push({
      pathname: '/book-preview',
      params: {
        id: selectedCard.id,
        genre: selectedCard.genre,
        genreLabel: selectedCard.genreLabel,
        title: selectedCard.title,
        color: selectedCard.color,
        imageUrl: selectedCard.imageUrl ?? '',
        prompt: selectedCard.prompt,
        displayOrder: String(selectedCard.displayOrder),
      },
    });
    clearSelection();
  }, [clearSelection, router, selectedCard]);

  return (
    <View style={styles.container}>
      <BookCoverGallery
        headline={headline}
        cards={cards}
        isLoading={isLoading}
        selectedCardId={selectedCard?.id ?? null}
        onBookPress={handleBookPress}
      />

      <BookLaunchTransition
        card={selectedCard}
        origin={origin}
        isVisible={!!selectedCard && !!origin}
        onFinish={handleLaunchFinish}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
  },
});
