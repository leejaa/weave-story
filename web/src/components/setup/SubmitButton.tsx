import styles from './SubmitButton.module.css';

type Props = {
  label: string;
  pendingLabel: string;
  canSubmit: boolean;
  isPending: boolean;
  onPress: () => void;
};

const ChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

/** 우측 정렬 밑줄형 제출 버튼 (story-prompt-submit-button.tsx 동일). */
export function SubmitButton({ label, pendingLabel, canSubmit, isPending, onPress }: Props) {
  const active = canSubmit || isPending;
  return (
    <button
      className={cx(styles.button, active ? styles.active : styles.inactive, isPending && styles.pending)}
      disabled={!canSubmit || isPending}
      onClick={onPress}
    >
      <span className={styles.label}>{isPending ? pendingLabel : label}</span>
      {!isPending && <ChevronRight />}
    </button>
  );
}
