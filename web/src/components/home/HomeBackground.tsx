import styles from './HomeBackground.module.css';

/**
 * 홈 다크 분위기 배경. 실제 앱은 home-bg.mp4 비디오 + 스크림을 쓴다.
 * 지금은 동일한 무드의 다크 그라데이션 + 따뜻한 글로우로 대체.
 * (R2 비디오 URL 확보 시 <video>로 교체 — videoSrc prop 자리 마련)
 */
export function HomeBackground({ videoSrc }: { videoSrc?: string }) {
  return (
    <div className={styles.bg} aria-hidden>
      {videoSrc && (
        <video className={styles.video} src={videoSrc} autoPlay loop muted playsInline />
      )}
      <div className={styles.glow} />
      <div className={styles.scrim} />
      <div className={styles.floor} />
    </div>
  );
}
