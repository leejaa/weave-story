import styles from './StoryLoading.module.css';

type Props = {
  /** 책 그래픽 가로 크기(px) */
  size?: number;
  /** 하단 라벨(선택) */
  label?: string;
  /** 전체 화면 중앙 정렬 + 크림 배경 */
  fullscreen?: boolean;
};

/** 페이지에 글이 써지는 모션: 좌→우 줄이 차례로 그려진다 */
const LINES = [
  { x1: 11, y1: 18, x2: 28, y2: 18 },
  { x1: 36, y1: 18, x2: 53, y2: 18 },
  { x1: 11, y1: 24, x2: 28, y2: 24 },
  { x1: 36, y1: 24, x2: 53, y2: 24 },
  { x1: 11, y1: 30, x2: 28, y2: 30 },
  { x1: 36, y1: 30, x2: 53, y2: 30 },
];

/**
 * 페이지 로드/전환용 공통 로딩 — 스피너 대신 "펼친 책에 글이 써지는" 모션.
 * 책 외곽선/책등은 항상 떠 있고(정적), 페이지 글줄이 좌→우로 차례로 그려진다.
 * 즉시 렌더되는 SVG/CSS(라이브러리 없음, 컴포지터 구동)라 짧은 로딩에서도 빈 화면이 없다.
 * (Lottie는 초기화 수백 ms로 짧은 로딩엔 부적합 → 생성중/쓰는중 긴 화면에만 사용.)
 */
export function StoryLoading({ size = 58, label, fullscreen = false }: Props) {
  return (
    <div
      className={fullscreen ? styles.fullscreen : styles.inline}
      role="progressbar"
      aria-label={label ?? '불러오는 중'}
    >
      <svg
        className={styles.book}
        width={size}
        height={Math.round(size * 0.7)}
        viewBox="0 0 64 44"
        fill="none"
        aria-hidden
      >
        {/* 펼친 책 외곽선 + 책등 (항상 표시) */}
        <path
          className={styles.outline}
          d="M32 10 C 22 4, 10 5, 5 9 L 5 36 C 10 32, 22 33, 32 39 C 42 33, 54 32, 59 36 L 59 9 C 54 5, 42 4, 32 10 Z"
        />
        <line className={styles.outline} x1="32" y1="10" x2="32" y2="39" />
        {/* 써지는 글줄 */}
        {LINES.map((l, i) => (
          <line
            key={i}
            className={styles.write}
            style={{ animationDelay: `${i * 0.18}s` }}
            pathLength={1}
            {...l}
          />
        ))}
      </svg>
      {label && <p className={styles.label}>{label}</p>}
    </div>
  );
}
