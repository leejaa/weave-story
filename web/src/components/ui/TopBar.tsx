import type { ReactNode } from 'react';
import styles from './TopBar.module.css';

type Props = {
  title?: string;
  /** 뒤로가기 핸들러 (없으면 뒤로가기 버튼 숨김) */
  onBack?: () => void;
  /** 우측 액션 슬롯 */
  action?: ReactNode;
};

const ChevronLeft = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export function TopBar({ title, onBack, action }: Props) {
  return (
    <div className={styles.bar}>
      <div className={styles.side}>
        {onBack && (
          <button className={styles.back} onClick={onBack} aria-label="뒤로">
            <ChevronLeft />
          </button>
        )}
      </div>
      {title && <div className={styles.title}>{title}</div>}
      <div className={styles.side} data-align="end">
        {action}
      </div>
    </div>
  );
}
