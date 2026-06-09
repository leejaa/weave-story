import { READING_COPY } from '@/features/reading/copy';
import { Spinner } from '@/components/ui';
import styles from './ChapterErrorPage.module.css';

type Props = {
  onRetry: () => void;
  onBack: () => void;
  retrying: boolean;
};

/** 챕터 생성 실패 화면 (chapter-error-page.tsx 동일). */
export function ChapterErrorPage({ onRetry, onBack, retrying }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.mark}>· · ·</div>
        <h2 className={styles.title}>{READING_COPY.error.title}</h2>
        <p className={styles.body}>{READING_COPY.error.body}</p>

        <button className={styles.primaryBtn} onClick={onRetry} disabled={retrying}>
          {retrying ? <Spinner size={18} tone="light" /> : READING_COPY.error.retry}
        </button>
        <button className={styles.secondaryBtn} onClick={onBack} disabled={retrying}>
          {READING_COPY.error.back}
        </button>
      </div>
    </div>
  );
}
