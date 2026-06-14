import { MEDIA } from '@/lib/media';
import { BackgroundVideo } from '@/components/ui/BackgroundVideo';
import styles from './HomeBackground.module.css';

/**
 * 홈 배경 — home-bg.mp4 루프 비디오 + 스크림 + 2단 바닥 페이드.
 * 비디오는 BackgroundVideo로 지연 로드(포스터 즉시, 비디오 idle 후) — 모바일 웹뷰 성능.
 */
export function HomeBackground({ videoSrc = MEDIA.homeVideo }: { videoSrc?: string }) {
  return (
    <div className={styles.bg} aria-hidden>
      <BackgroundVideo className={styles.video} src={videoSrc} poster={MEDIA.homePoster} />
      <div className={styles.scrim} />
      <div className={styles.floor1} />
      <div className={styles.floor2} />
    </div>
  );
}
