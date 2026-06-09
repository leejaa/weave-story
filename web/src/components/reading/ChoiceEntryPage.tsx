import { READING_COPY } from '@/features/reading/copy';
import styles from './ChoiceEntryPage.module.css';

type Props = {
  situation: string | null;
  question: string | null;
  onOpen: () => void;
};

const ChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

/** 챕터 끝 선택 진입 카드 (choice-entry-page.tsx 동일). */
export function ChoiceEntryPage({ situation, question, onOpen }: Props) {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.kicker}>{READING_COPY.choice.entryKicker}</div>
        {situation && <p className={styles.situation}>{situation}</p>}
        <h2 className={styles.question}>{question || READING_COPY.choice.defaultQuestion}</h2>
        <button className={styles.button} onClick={onOpen}>
          <span>{READING_COPY.choice.openChoice}</span>
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}
