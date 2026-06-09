import type { ThreadListItem } from '@/lib/types';
import styles from './StoryCard.module.css';

type Props = {
  thread: ThreadListItem;
  onPress: (threadId: string) => void;
};

/** 그라데이션 스크림 단계 — 기존 앱 story-card.tsx SCRIM_STOPS 와 동일 */
const SCRIM_STOPS = [0, 0.01, 0.04, 0.09, 0.16, 0.25, 0.36, 0.46];

/**
 * 내 이야기 그리드의 한 권 — 기존 앱 components/story-card.tsx 대응.
 * 표지(3:4) + 스크림 + 제목 + 진행바(진행중)/완결배지(완결) + 메타행(장르·챕터수).
 */
export function StoryCard({ thread, onPress }: Props) {
  const progress = parseFloat(thread.progress);
  const finished = thread.status === 'completed';
  const pct = Math.round((Number.isFinite(progress) ? progress : 0) * 100);

  return (
    <button className={styles.card} onClick={() => onPress(thread.threadId)} type="button">
      <span className={styles.cover}>
        {thread.coverImageUrl && (
          <img className={styles.img} src={thread.coverImageUrl} alt="" loading="lazy" draggable={false} />
        )}
        <span className={styles.scrim} aria-hidden>
          {SCRIM_STOPS.map((opacity, i) => (
            <i key={i} style={{ backgroundColor: `rgba(0,0,0,${opacity})` }} />
          ))}
        </span>
        <span className={styles.coverTitle}>{thread.title ?? ''}</span>

        {!finished && (
          <span className={styles.progressTrack} aria-hidden>
            <span className={styles.progressFill} style={{ width: `${pct}%` }} />
          </span>
        )}
        {finished && <span className={styles.badge}>완결</span>}
      </span>

      <span className={styles.meta}>
        <span className={styles.genre}>{thread.genre ?? thread.mood ?? ''}</span>
        {!finished && (
          <span className={styles.chapter}>
            {thread.currentChapter} / {thread.estimatedChapters}
          </span>
        )}
      </span>
    </button>
  );
}
