import { useNavigate } from 'react-router-dom';
import { StoryLoading } from '@/components/ui';
import { StoryCard } from '@/components/stories/StoryCard';
import { useThreads } from '@/features/threads/useThreads';
import styles from './StoriesPage.module.css';

/**
 * 내 이야기 탭 — 기존 앱 app/(tabs)/stories.tsx 대응.
 * 진행 중 / 완결 섹션으로 나눠 2열 그리드로 스레드를 보여준다.
 * (둘 다 있을 때만 섹션 라벨 노출.) 탭 → /reading/:id.
 */
export function StoriesPage() {
  const navigate = useNavigate();
  const { threads, isLoading } = useThreads();

  const ready = threads.filter((t) => t.title !== null);
  const ongoing = ready.filter((t) => t.status !== 'completed');
  const finished = ready.filter((t) => t.status === 'completed');
  const showSections = ongoing.length > 0 && finished.length > 0;

  const openThread = (threadId: string) => navigate(`/reading/${threadId}`);

  return (
    <div className={styles.root}>
      <div className={styles.scroll}>
        <header className={styles.header}>
          <h1 className={styles.title}>내 이야기</h1>
          <button
            className={styles.profileBtn}
            onClick={() => navigate('/profile')}
            aria-label="프로필"
            type="button"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
        </header>

        {isLoading ? (
          <div className={styles.loading}>
            <StoryLoading size={120} />
          </div>
        ) : ready.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>아직 만든 이야기가 없어요</p>
            <p className={styles.emptySub}>새 이야기 탭에서 첫 번째 이야기를 시작해보세요</p>
          </div>
        ) : (
          <>
            {showSections && ongoing.length > 0 && (
              <p className={styles.sectionLabel}>진행 중</p>
            )}
            {ongoing.length > 0 && (
              <div className={styles.grid}>
                {ongoing.map((thread) => (
                  <StoryCard key={thread.threadId} thread={thread} onPress={openThread} />
                ))}
              </div>
            )}

            {showSections && finished.length > 0 && (
              <p className={`${styles.sectionLabel} ${styles.sectionLabelGap}`}>완결</p>
            )}
            {finished.length > 0 && (
              <div className={styles.grid}>
                {finished.map((thread) => (
                  <StoryCard key={thread.threadId} thread={thread} onPress={openThread} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
