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

/**
 * 룰드 페이퍼 멀티라인 프롬프트 입력.
 * 라인은 textarea 배경(34px 반복 = line-height)으로 그려, 글자 줄과 항상 정확히 정렬되고
 * 텍스트가 스크롤되면 라인도 함께 움직인다(background-attachment: local).
 */
export function PromptInput({ value, placeholder, onChange }: Props) {
  const hasValue = value.trim().length > 0;
  return (
    <div className={styles.sheet}>
      <textarea
        className={styles.input}
        style={{ paddingRight: hasValue ? 30 : 0 }}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
      />
      {hasValue && (
        <button className={styles.clearBtn} onClick={() => onChange('')} aria-label="지우기">
          <CloseCircle />
        </button>
      )}
    </div>
  );
}
