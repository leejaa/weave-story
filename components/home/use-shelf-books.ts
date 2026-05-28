import { useMemo } from 'react';
import type { SampleCardData } from '@/lib/api/types';

export type ShelfBook = {
  card: SampleCardData;
  frame: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
};

const SELECTABLE_BOOK_FRAMES = [
  { left: 0.11, top: 0.36, width: 0.095, height: 0.23 },
  { left: 0.245, top: 0.36, width: 0.085, height: 0.23 },
  { left: 0.385, top: 0.36, width: 0.09, height: 0.23 },
  { left: 0.525, top: 0.36, width: 0.085, height: 0.23 },
  { left: 0.66, top: 0.36, width: 0.09, height: 0.23 },
  { left: 0.795, top: 0.36, width: 0.09, height: 0.23 },
] as const;

export function useShelfBooks(cards: SampleCardData[]): ShelfBook[] {
  return useMemo(
    () =>
      cards.map((card, index) => ({
        card,
        frame: SELECTABLE_BOOK_FRAMES[index % SELECTABLE_BOOK_FRAMES.length],
      })),
    [cards],
  );
}
