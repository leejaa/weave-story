import Lottie from 'lottie-react';
import bookBirthLoader from '@/assets/animations/story-book-birth-loader.json';
import styles from './StoryLoading.module.css';

type Props = {
  /** 로티 가로 크기(px). 높이는 4:3 비율로 자동. */
  size?: number;
  /** 하단 라벨(선택) */
  label?: string;
  /** 전체 화면 중앙 정렬 + 크림 배경 */
  fullscreen?: boolean;
};

/**
 * 페이지 로드/전환용 공통 로딩 — 단순 스피너 대신 책이 펼쳐지는 Lottie.
 * (생성중 화면 StoryLoader 와 같은 에셋을 작게 재사용해 톤을 통일)
 */
export function StoryLoading({ size = 140, label, fullscreen = false }: Props) {
  return (
    <div
      className={fullscreen ? styles.fullscreen : styles.inline}
      role="progressbar"
      aria-label={label ?? '불러오는 중'}
    >
      <Lottie
        animationData={bookBirthLoader}
        loop
        autoplay
        style={{ width: size, height: Math.round(size * 0.75) }}
      />
      {label && <p className={styles.label}>{label}</p>}
    </div>
  );
}
