import styles from './CoverTitle.module.css';

/** 책 표지 제목 — 기존 cover-title-text.tsx 와 동일: Jua 23/30, -1deg, 3겹 그림자. */
export function CoverTitle({ title }: { title: string }) {
  return (
    <div className={styles.wrap} aria-hidden>
      <span className={styles.title}>{title}</span>
    </div>
  );
}
