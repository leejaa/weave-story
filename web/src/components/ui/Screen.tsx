import type { ReactNode } from 'react';
import styles from './Screen.module.css';

type Props = {
  children: ReactNode;
  /** 본문을 세로 스크롤 가능하게 (기본 true) */
  scroll?: boolean;
  /** 좌우 기본 패딩 적용 (기본 true) */
  padded?: boolean;
  /** 화면 상단 고정 헤더 (TopBar 등) */
  header?: ReactNode;
  /** 화면 하단 고정 영역 (CTA 등) */
  footer?: ReactNode;
  className?: string;
};

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

/**
 * 앱인토스 WebView 한 화면의 레이아웃 골격.
 * safe-area inset을 흡수하고, header/body/footer 슬롯으로 조립한다.
 */
export function Screen({ children, scroll = true, padded = true, header, footer, className }: Props) {
  return (
    <div className={styles.root}>
      {header && <div className={styles.header}>{header}</div>}
      <div className={cx(styles.body, scroll && 'scroll-y', padded && styles.padded, className)}>
        {children}
      </div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}
