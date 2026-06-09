import styles from './PromptInput.module.css';

type Props = {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
};

const CloseCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

/** 룰드 페이퍼 위 멀티라인 프롬프트 입력 (story-prompt-input-field.tsx 동일: Jua, 라인 36px). */
export function PromptInput({ value, placeholder, onChange }: Props) {
  const hasValue = value.trim().length > 0;
  return (
    <div className={styles.sheet}>
      <div className={styles.ruleStack} aria-hidden>
        <span className={styles.rule} />
        <span className={styles.rule} />
        <span className={styles.rule} />
        <span className={styles.rule} />
      </div>
      <textarea
        className={styles.input}
        style={{ paddingRight: hasValue ? 30 : 0 }}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
      />
      {hasValue && (
        <button className={styles.clearBtn} onClick={() => onChange('')} aria-label="지우기">
          <CloseCircle />
        </button>
      )}
    </div>
  );
}
