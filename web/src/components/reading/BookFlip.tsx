import styles from './BookFlip.module.css';

type Props = {
  /** 펼친 책 가로폭(px) */
  size?: number;
  /** 전체 화면 중앙 정렬 + 크림 배경 */
  fullscreen?: boolean;
};

const PAGES = [-0.0, -0.5, -1.0, -1.5, -2.0];

export function BookFlip({ size = 190, fullscreen = false }: Props) {
  return (
    <div
      className={fullscreen ? styles.fullscreen : styles.inline}
      role="progressbar"
      aria-label="불러오는 중"
    >
      <div className={styles.wrap} style={{ fontSize: `${size}px` }} aria-hidden>
        <span className={styles.glow} />
        <div className={styles.book}>
          <span className={`${styles.cover} ${styles.left}`} />
          <span className={`${styles.cover} ${styles.right}`} />
          <span className={styles.spine} />
          {PAGES.map((d, i) => (
            <span key={i} className={styles.page} style={{ animationDelay: `${d}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
