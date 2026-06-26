import { READING_COPY } from '@/features/reading/copy';
import styles from './PromptPage.module.css';

type Props = { prompt: string };

/** 1화 앞 표지 — 이 이야기를 만든 원본 프롬프트를 먼저 보여준다. */
export function PromptPage({ prompt }: Props) {
  const c = READING_COPY.promptCover;
  return (
    <div className={styles.page}>
      <div className={styles.center}>
        <div className={styles.label}>{c.label}</div>
        <p className={styles.prompt}>{prompt}</p>
      </div>
      <div className={styles.hint}>{c.hint}</div>
    </div>
  );
}
