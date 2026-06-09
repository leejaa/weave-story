import type { SampleCardData } from '@/lib/types';
import { CoverTitle } from './CoverTitle';
import styles from './BookCard.module.css';

type Props = {
  card: SampleCardData;
  index: number;
  onSelect: (card: SampleCardData) => void;
};

/**
 * 홈 레일의 한 권 — 기존 sample-book-cover.tsx 와 동일 수치.
 * slot 176×286, 표지(coverBase) + 책장(pageBlock 14), spine 24, rim 테두리, 장르 pill, Jua 제목, 글로우/펄스.
 */
export function BookCard({ card, index, onSelect }: Props) {
  return (
    <button
      className={styles.slot}
      style={{ animationDelay: `${index * 130}ms` }}
      onClick={() => onSelect(card)}
      aria-label={card.title.replace(/\n/g, ' ')}
    >
      <span className={styles.glow} />
      <span className={styles.book}>
        <span className={styles.cover} style={{ backgroundColor: card.color }}>
          {card.imageUrl && (
            <img className={styles.img} src={card.imageUrl} alt="" loading="lazy" draggable={false} />
          )}
          <span className={styles.imageShade} />
          <span className={styles.titleShade} />
          <span className={styles.spine} />
          <span className={styles.rim} />
          <span className={styles.genrePill}>
            <span className={styles.genre}>{card.genreLabel}</span>
          </span>
          <CoverTitle title={card.title} />
        </span>
        <span className={styles.pageBlock} aria-hidden>
          {Array.from({ length: 9 }, (_, i) => (
            <i key={i} style={{ top: `${8 + i * 9}%`, opacity: i % 2 === 0 ? 0.2 : 0.09 }} />
          ))}
        </span>
      </span>
    </button>
  );
}
