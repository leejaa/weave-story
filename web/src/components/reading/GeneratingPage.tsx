import { READING_COPY } from '@/features/reading/copy';
import { useNotificationAgreement } from '@/features/reading/useNotificationAgreement';
import { BookFlip } from './BookFlip';
import styles from './GeneratingPage.module.css';

/** 챕터 생성 중 페이지 — 펼친 책 페이지가 3D로 넘어가는 모션. */
export function GeneratingPage() {
  const g = READING_COPY.generating;
  const { agreed, requesting, request } = useNotificationAgreement();

  return (
    <div className={styles.page}>
      <div className={styles.stage}>
        <BookFlip size={188} />
      </div>
      <p className={styles.title}>{g.title}</p>
      <p className={styles.body}>{g.body}</p>
      <button
        className={styles.notify}
        onClick={request}
        disabled={agreed || requesting}
        aria-label={agreed ? '알림 설정 완료' : '알림 받기'}
      >
        <span className={styles.notifyText}>
          {agreed ? `✓  ${g.notifyDone}` : `🔔  ${g.notify}`}
        </span>
      </button>
    </div>
  );
}
