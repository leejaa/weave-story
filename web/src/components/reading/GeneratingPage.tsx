import Lottie from 'lottie-react';
import bookBirthLoader from '@/assets/animations/story-book-birth-loader.json';
import { READING_COPY } from '@/features/reading/copy';
import styles from './GeneratingPage.module.css';

/** 챕터 생성 중 페이지 (generating-page.tsx + StoryLoader 대응). */
export function GeneratingPage() {
  const g = READING_COPY.generating;
  return (
    <div className={styles.page}>
      <div className={styles.stage}>
        <Lottie animationData={bookBirthLoader} loop autoplay className={styles.animation} />
      </div>
      <p className={styles.title}>{g.title}</p>
      <p className={styles.body}>{g.body}</p>
      <p className={styles.estimate}>{g.estimate}</p>
      <div className={styles.notify}>
        <span className={styles.notifyText}>{`🔔  ${g.notify}`}</span>
      </div>
    </div>
  );
}
