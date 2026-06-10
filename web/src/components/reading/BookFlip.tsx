import styles from './BookFlip.module.css';

type Props = {
  /** 펼친 책 가로폭(px) */
  size?: number;
};

/** 페이지별 음수 딜레이(위상 분산 → 연속 리플) */
const PAGES = [-0.0, -0.5, -1.0, -1.5, -2.0];

/**
 * 펼친 책의 페이지가 3D로 사르륵 넘어가는 모션 (생성중 화면 Lottie 대체).
 * 전부 CSS 3D transform(컴포지터 구동, 라이브러리 없음).
 */
export function BookFlip({ size = 190 }: Props) {
  return (
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
  );
}
