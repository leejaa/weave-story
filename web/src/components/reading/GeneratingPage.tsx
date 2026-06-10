import { READING_COPY } from '@/features/reading/copy';
import { BookFlip } from './BookFlip';
import styles from './GeneratingPage.module.css';

/** 챕터 생성 중 페이지 — 펼친 책 페이지가 3D로 넘어가는 모션. */
export function GeneratingPage() {
  const g = READING_COPY.generating;
  return (
    <div className={styles.page}>
      <div className={styles.stage}>
        <BookFlip size={188} />
      </div>
      <p className={styles.title}>{g.title}</p>
      <p className={styles.body}>{g.body}</p>
      <p className={styles.estimate}>{g.estimate}</p>
      <div className={styles.notify}>
        <span className={styles.notifyText}>{`🔔  ${g.notify}`}</span>
      </div>
    </div>
  );
}
