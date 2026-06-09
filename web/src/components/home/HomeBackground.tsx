import { MEDIA } from '@/lib/media';
import styles from './HomeBackground.module.css';

/**
 * 홈 배경 — 기존 앱과 동일하게 home-bg.mp4 루프 비디오 + 스크림 + 2단 바닥 페이드.
 * (components/home/book-cover-gallery.tsx stage 스타일과 동일 수치)
 */
export function HomeBackground({ videoSrc = MEDIA.homeVideo }: { videoSrc?: string }) {
  return (
    <div className={styles.bg} aria-hidden>
      <video className={styles.video} src={videoSrc} autoPlay loop muted playsInline preload="auto" />
      <div className={styles.scrim} />
      <div className={styles.floor1} />
      <div className={styles.floor2} />
    </div>
  );
}
