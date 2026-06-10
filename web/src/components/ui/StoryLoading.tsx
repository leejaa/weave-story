import styles from './StoryLoading.module.css';

type Props = {
  /** 장면 기준 크기(px) = 책 가로폭 */
  size?: number;
  /** 하단 라벨(선택) */
  label?: string;
  /** 전체 화면 중앙 정렬 + 크림 배경 */
  fullscreen?: boolean;
};

/** 페이지에 글이 써지는 줄 (좌/우 페이지 × 3행) */
const LINES = [
  { x1: 11, y1: 18, x2: 28, y2: 18 },
  { x1: 36, y1: 18, x2: 53, y2: 18 },
  { x1: 11, y1: 24, x2: 28, y2: 24 },
  { x1: 36, y1: 24, x2: 53, y2: 24 },
  { x1: 11, y1: 30, x2: 28, y2: 30 },
  { x1: 36, y1: 30, x2: 53, y2: 30 },
];

/** 떠오르는 금가루 (위치 %, 음수 딜레이로 위상 분산) */
const SPARKS = [
  { x: 10, y: 34, d: -0.2 },
  { x: 88, y: 28, d: -1.4 },
  { x: 50, y: 8, d: -0.7 },
  { x: 20, y: 78, d: -2.0 },
  { x: 80, y: 74, d: -1.0 },
  { x: 4, y: 58, d: -2.5 },
  { x: 95, y: 54, d: -0.4 },
  { x: 64, y: 88, d: -1.8 },
];

/**
 * 페이지 로드/전환용 공통 로딩 — 화려한 "이야기가 써지는" 장면.
 * 글로우 펄스 + 흔들리는 펼친 책 + 좌→우로 써지는 글줄 + 떠오르는 금가루.
 * 전부 CSS(컴포지터 구동, 라이브러리 없음)라 짧은 로딩에도 즉시 렌더된다.
 * (Lottie는 초기화 수백 ms로 짧은 로딩엔 부적합 → 생성중/쓰는중 긴 화면에만 사용.)
 */
export function StoryLoading({ size = 78, label, fullscreen = false }: Props) {
  return (
    <div
      className={fullscreen ? styles.fullscreen : styles.inline}
      role="progressbar"
      aria-label={label ?? '불러오는 중'}
    >
      <div className={styles.scene} style={{ fontSize: `${size}px` }}>
        <span className={styles.glow} aria-hidden />
        {SPARKS.map((s, i) => (
          <span
            key={i}
            className={styles.spark}
            style={{ left: `${s.x}%`, top: `${s.y}%`, animationDelay: `${s.d}s` }}
            aria-hidden
          />
        ))}
        <svg className={styles.book} viewBox="0 0 64 44" fill="none" aria-hidden>
          <path
            className={styles.outline}
            d="M32 10 C 22 4, 10 5, 5 9 L 5 36 C 10 32, 22 33, 32 39 C 42 33, 54 32, 59 36 L 59 9 C 54 5, 42 4, 32 10 Z"
          />
          <line className={styles.outline} x1="32" y1="10" x2="32" y2="39" />
          {LINES.map((l, i) => (
            <line
              key={i}
              className={styles.write}
              style={{ animationDelay: `${i * 0.16}s` }}
              pathLength={1}
              {...l}
            />
          ))}
        </svg>
      </div>
      {label && <p className={styles.label}>{label}</p>}
    </div>
  );
}
