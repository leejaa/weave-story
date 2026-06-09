import type { SampleCardData } from '@/lib/types';
import styles from './BookCard.module.css';

type Props = {
  card: SampleCardData;
  /** 레일 내 순번 — 펄스 애니메이션 스태거에 사용 */
  index: number;
  onSelect: (card: SampleCardData) => void;
};

/** 홈 레일의 한 권 — 입체 책 표지(표지면 + 책장 스파인 + 장르 pill + 제목). */
export function BookCard({ card, index, onSelect }: Props) {
  return (
    <button
      className={styles.book}
      style={{ animationDelay: `${index * 130}ms` }}
      onClick={() => onSelect(card)}
      aria-label={card.title.replace(/\n/g, ' ')}
    >
      <div className={styles.aura} style={{ background: card.color }} />
      <div className={styles.cover} style={{ backgroundColor: card.color }}>
        {card.imageUrl && (
          <img className={styles.img} src={card.imageUrl} alt="" loading="lazy" draggable={false} />
        )}
        <div className={styles.titleShade} />
        <div className={styles.spine} />
        <span className={styles.pill}>{card.genreLabel}</span>
        <span className={styles.title}>{card.title}</span>
      </div>
      <div className={styles.pages} aria-hidden>
        {Array.from({ length: 9 }, (_, i) => (
          <i key={i} style={{ top: `${8 + i * 9}%`, opacity: i % 2 === 0 ? 0.22 : 0.1 }} />
        ))}
      </div>
    </button>
  );
}
