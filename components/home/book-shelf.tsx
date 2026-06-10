import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalizedSampleCards } from '@/hooks/use-localized-sample-cards';
import { BookCoverGallery } from './book-cover-gallery';
import type { SampleCardData } from '@/lib/api/types';
import type { BookOrigin } from './use-book-selection';

// 전환 상태(selectedCard, origin)는 index.tsx가 소유.
// BookShelf는 카드 갤러리만 표시하고, 선택 이벤트를 위로 올림.
type Props = {
  headline: string;
  selectedCardId: string | null;
  onCardSelected: (card: SampleCardData, origin: BookOrigin) => void;
};

export function BookShelf({ headline, selectedCardId, onCardSelected }: Props) {
  const { data: cards = [], isLoading } = useLocalizedSampleCards();

  const handleBookPress = useCallback(
    (card: SampleCardData, bookOrigin: BookOrigin) => {
      onCardSelected(card, bookOrigin);
    },
    [onCardSelected],
  );

  return (
    <View style={styles.container}>
      <BookCoverGallery
        headline={headline}
        cards={cards}
        isLoading={isLoading}
        selectedCardId={selectedCardId}
        onBookPress={handleBookPress}
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
