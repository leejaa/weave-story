import { READING_COPY } from '@/features/reading/copy';
import styles from './ChapterRibbon.module.css';

type Props = {
  title: string;
  chapter: number;
  totalChapters: number;
  onBack: () => void;
};

const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const pad2 = (n: number) => String(n).padStart(2, '0');

/** 읽기 화면 상단 리본 — 뒤로/제목/북마크(CHAPTER NN / NN)/진행 바 (chapter-ribbon.tsx 대응). */
export function ChapterRibbon({ title, chapter, totalChapters, onBack }: Props) {
  const progress = Math.max(0, Math.min(1, chapter / Math.max(totalChapters, 1)));
  return (
    <div className={styles.ribbon}>
      <div className={styles.topRow}>
        <button className={styles.backBtn} onClick={onBack} aria-label="뒤로">
          <ChevronLeft />
        </button>

        <div className={styles.titleBlock}>
          <div className={styles.title}>{title}</div>
          <div className={styles.position}>{READING_COPY.nowReading}</div>
        </div>

        <div className={styles.bookmark}>
          <span className={styles.eyebrow}>CHAPTER</span>
          <span className={styles.count}>{pad2(chapter)} / {pad2(totalChapters)}</span>
          <span className={styles.tailBorder} aria-hidden />
          <span className={styles.tail} aria-hidden />
        </div>
      </div>

      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}
