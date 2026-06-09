import { READING_COPY } from '@/features/reading/copy';
import styles from './InterventionPage.module.css';

/** 챕터 사이 "당신의 선택" 구분선 (intervention-page.tsx 동일). */
export function InterventionPage({ text }: { text: string }) {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <span className={styles.line} />
        <span className={styles.label}>{READING_COPY.choice.yourChoice}</span>
        <span className={styles.choiceText}>&ldquo;{text}&rdquo;</span>
        <span className={styles.line} />
      </div>
    </div>
  );
}
