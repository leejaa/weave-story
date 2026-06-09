import type { SampleCardData } from '@/lib/types';
import { BookCard } from './BookCard';
import styles from './BookRail.module.css';

type Props = {
  cards: SampleCardData[];
  onSelect: (card: SampleCardData) => void;
};

/** 샘플카드 가로 스크롤 레일. */
export function BookRail({ cards, onSelect }: Props) {
  return (
    <div className={styles.rail}>
      {cards.map((card, i) => (
        <BookCard key={card.id} card={card} index={i} onSelect={onSelect} />
      ))}
    </div>
  );
}
