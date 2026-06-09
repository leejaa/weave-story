import styles from './SetupHeader.module.css';

const ChevronLeft = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

/** 셋업 헤더 — 원형 테두리 뒤로가기 (story-prompt-header.tsx 동일). */
export function SetupHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className={styles.header}>
      <button className={styles.backBtn} onClick={onBack} aria-label="뒤로">
        <ChevronLeft />
      </button>
    </div>
  );
}
