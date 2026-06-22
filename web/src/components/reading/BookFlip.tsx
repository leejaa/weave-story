import type { CSSProperties } from 'react';
import styles from './BookFlip.module.css';

type Props = {
  /** 펼친 책 가로폭(px) */
  size?: number;
  /** 전체 화면 중앙 정렬 + 크림 배경. 풀스크린일 때만 화려한 빛 연출이 더해진다. */
  fullscreen?: boolean;
};

const PAGES = [-0.0, -0.5, -1.0, -1.5, -2.0];
// 풀스크린 전용: 페이지를 더 촘촘히 넘겨 풍성한 펼침을 연출.
const FANCY_PAGES = [-0.0, -0.4, -0.8, -1.2, -1.6, -2.0, -2.4];
// 풀스크린 전용 장식 레이어 카운트.
const THREADS = [0, 1, 2, 3, 4];
const MOTES = [0, 1, 2, 3, 4, 5, 6, 7];

export function BookFlip({ size = 190, fullscreen = false }: Props) {
  const pages = fullscreen ? FANCY_PAGES : PAGES;
  return (
    <div
      className={fullscreen ? styles.fullscreen : styles.inline}
      role="progressbar"
      aria-label="불러오는 중"
    >
      <div
        className={`${styles.wrap}${fullscreen ? ` ${styles.fancy}` : ''}`}
        style={{ fontSize: `${size}px` }}
        aria-hidden
      >
        <span className={styles.glow} />
        {fullscreen && <span className={styles.glowGold} />}

        {fullscreen && (
          <div className={styles.threads}>
            {THREADS.map((i) => (
              <span key={i} className={styles.thread} style={{ '--i': i } as CSSProperties} />
            ))}
          </div>
        )}

        <div className={styles.book}>
          <span className={`${styles.cover} ${styles.left}`} />
          <span className={`${styles.cover} ${styles.right}`} />
          <span className={styles.spine} />
          {pages.map((d, i) => (
            <span key={i} className={styles.page} style={{ animationDelay: `${d}s` }} />
          ))}
          {fullscreen && <span className={styles.sweep} />}
        </div>

        {fullscreen && (
          <div className={styles.motes}>
            {MOTES.map((i) => (
              <span key={i} className={styles.mote} style={{ '--i': i } as CSSProperties} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
