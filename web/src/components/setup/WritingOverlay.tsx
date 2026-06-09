import styles from './WritingOverlay.module.css';

type Props = {
  title: string;
  subtitle: string;
};

/**
 * 이야기 생성 중 로딩 오버레이 (story-writing-loading-overlay.tsx 대응).
 * 원본은 Lottie(story-writing-loader.json). 웹에서는 가벼운 CSS 잉크 애니메이션으로 대체.
 */
export function WritingOverlay({ title, subtitle }: Props) {
  return (
    <div className={styles.backdrop} role="progressbar" aria-label={title}>
      <div className={styles.panel}>
        <div className={styles.dots} aria-hidden>
          <span /><span /><span />
        </div>
        <p className={styles.title}>{title}</p>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
    </div>
  );
}
