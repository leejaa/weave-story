import Lottie from 'lottie-react';
import writingLoader from '@/assets/animations/story-writing-loader.json';
import styles from './WritingOverlay.module.css';

type Props = {
  title: string;
  subtitle: string;
};

/**
 * 이야기 생성 중 로딩 오버레이 (story-writing-loading-overlay.tsx 대응).
 * 원본 Lottie(story-writing-loader.json)를 그대로 사용. 210×158.
 */
export function WritingOverlay({ title, subtitle }: Props) {
  return (
    <div className={styles.backdrop} role="progressbar" aria-label={title}>
      <div className={styles.panel}>
        <Lottie animationData={writingLoader} loop autoplay className={styles.animation} />
        <p className={styles.title}>{title}</p>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
    </div>
  );
}
