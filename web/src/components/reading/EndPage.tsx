import { READING_COPY } from '@/features/reading/copy';
import styles from './EndPage.module.css';

/** 이야기 완료 페이지. */
export function EndPage() {
  return (
    <div className={styles.page}>
      <span className={styles.mark}>{READING_COPY.end}</span>
    </div>
  );
}
