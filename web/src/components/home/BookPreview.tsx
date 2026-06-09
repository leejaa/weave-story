import type { SampleCardData } from '@/lib/types';
import { MEDIA } from '@/lib/media';
import styles from './BookPreview.module.css';

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

type Props = {
  card: SampleCardData;
  onClose: () => void;
  onStart: () => void;
};

/**
 * 카드 선택 후 펼친 책 미리보기 (book-preview-screen.tsx 대응).
 * 왼쪽 페이지=장르/제목/프롬프트, 오른쪽 페이지=표지. 아무데나 탭 → 셋업. X → 홈.
 */
export function BookPreview({ card, onClose, onStart }: Props) {
  return (
    <div className={styles.root}>
      <img className={styles.scene} src={MEDIA.openBookScene} alt="" draggable={false} />
      <div className={styles.sceneShade} aria-hidden />

      {/* 전체 탭 → 시작 (페이지보다 아래, 닫기보다 아래) */}
      <button className={styles.tapLayer} onClick={onStart} aria-label="이야기 시작하기" />

      <button className={styles.closeBtn} onClick={onClose} aria-label="닫기">
        <CloseIcon />
      </button>

      <div className={styles.leftPage} aria-hidden>
        <div className={styles.genre}>{card.genreLabel}</div>
        <div className={styles.title}>{card.title}</div>
        <p className={styles.prompt}>{card.prompt}</p>
      </div>

      <div className={styles.rightPage} aria-hidden>
        {card.imageUrl && (
          <div className={styles.coverFrame}>
            <img src={card.imageUrl} alt="" draggable={false} />
          </div>
        )}
      </div>
    </div>
  );
}
