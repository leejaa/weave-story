import styles from './StoryLoading.module.css';

type Props = {
  /** 장면 기준 크기(px) */
  size?: number;
  /** 하단 라벨(선택) */
  label?: string;
  /** 전체 화면 중앙 정렬 + 크림 배경 */
  fullscreen?: boolean;
};

/** 날실(세로) / 씨실(가로) 위치 */
const WARP = [8, 16, 24, 32, 40]; // 세로 실 x좌표 (정적)
// 가로 실: y좌표 + 음수 딜레이(위상 분산 → 짜이는 wave)
const WEFT = [
  { y: 8, d: -0.1 },
  { y: 16, d: -0.7 },
  { y: 24, d: -1.3 },
  { y: 32, d: -1.9 },
  { y: 40, d: -2.5 },
];

/**
 * 페이지 로드/전환용 공통 로딩 — "Weave"(실 짜기) 모션.
 * 날실(세로)은 떠 있고, 씨실(가로)이 좌→우로 차례차례 짜여 들어가며 천이 직조된다.
 * 글로우 + 미세한 숨쉬기 + 빛 스침으로 마감. 전부 CSS(컴포지터 구동, 라이브러리 없음)라
 * 짧은 로딩에도 즉시 렌더된다. (Lottie는 생성중/쓰는중 긴 화면에만 사용.)
 */
export function StoryLoading({ size = 76, label, fullscreen = false }: Props) {
  return (
    <div
      className={fullscreen ? styles.fullscreen : styles.inline}
      role="progressbar"
      aria-label={label ?? '불러오는 중'}
    >
      <div className={styles.scene} style={{ fontSize: `${size}px` }}>
        <span className={styles.glow} aria-hidden />
        <div className={styles.loom}>
          <svg className={styles.cloth} viewBox="0 0 48 48" fill="none" aria-hidden>
            {WARP.map((x) => (
              <line key={`a${x}`} className={styles.warp} x1={x} y1="6" x2={x} y2="42" />
            ))}
            {WEFT.map((w) => (
              <line
                key={`f${w.y}`}
                className={styles.weft}
                style={{ animationDelay: `${w.d}s` }}
                pathLength={1}
                x1="6"
                y1={w.y}
                x2="42"
                y2={w.y}
              />
            ))}
          </svg>
          <span className={styles.sheen} aria-hidden />
        </div>
      </div>
      {label && <p className={styles.label}>{label}</p>}
    </div>
  );
}
