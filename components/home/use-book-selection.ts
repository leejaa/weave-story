import { useCallback, useState } from 'react';
import type { SampleCardData } from '@/lib/api/types';

export type BookOrigin = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function useBookSelection() {
  const [selectedCard, setSelectedCard] = useState<SampleCardData | null>(null);
  const [origin, setOrigin] = useState<BookOrigin | null>(null);

  const selectBook = useCallback((card: SampleCardData, bookOrigin: BookOrigin) => {
    setSelectedCard(card);
    setOrigin(bookOrigin);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCard(null);
    setOrigin(null);
  }, []);

  return {
    selectedCard,
    origin,
    selectBook,
    clearSelection,
  };
}
