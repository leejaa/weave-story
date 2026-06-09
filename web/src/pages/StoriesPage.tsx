import styles from './StoriesPage.module.css';

/** 내 이야기 탭 — Task 8(내 이야기 목록)에서 본격 구현. 지금은 빈 상태 플레이스홀더. */
export function StoriesPage() {
  return (
    <div className={styles.root}>
      <div className={styles.scroll}>
        <header className={styles.header}>
          <div className={styles.eyebrow}>MY LIBRARY</div>
          <h1 className={styles.title}>내 이야기</h1>
        </header>

        <div className={styles.empty}>
          <p className={styles.emptyTitle}>아직 엮은 이야기가 없어요</p>
          <p className={styles.emptySub}>홈에서 카드를 골라 첫 이야기를 시작해보세요.</p>
        </div>
      </div>
    </div>
  );
}
