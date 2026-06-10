import styles from './StoryLoading.module.css';

type Props = {
  /** 스피너 지름(px) */
  size?: number;
  /** 하단 라벨(선택) */
  label?: string;
  /** 전체 화면 중앙 정렬 + 크림 배경 */
  fullscreen?: boolean;
};

/**
 * 페이지 로드/전환용 공통 로딩 — 즉시 렌더되는 경량 SVG 애니메이션.
 * (Lottie는 초기화에 수백 ms가 들어 0.2~0.4초짜리 짧은 로딩엔 빈 화면처럼 보여 부적합.
 *  Lottie는 시간이 충분한 생성중/쓰는중 화면에만 사용.)
 * "weave"(엮다) 결을 살린 이중 호(arc) 스피너 — thread 컬러.
 */
export function StoryLoading({ size = 46, label, fullscreen = false }: Props) {
  return (
    <div
      className={fullscreen ? styles.fullscreen : styles.inline}
      role="progressbar"
      aria-label={label ?? '불러오는 중'}
    >
      <svg className={styles.weave} width={size} height={size} viewBox="0 0 50 50" aria-hidden>
        <circle className={styles.track} cx="25" cy="25" r="20" />
        <circle className={styles.arc} cx="25" cy="25" r="20" />
      </svg>
      {label && <p className={styles.label}>{label}</p>}
    </div>
  );
}
