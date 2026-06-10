import { BookFlip } from '@/components/reading/BookFlip';
import styles from './WritingOverlay.module.css';

type Props = {
  title: string;
  subtitle: string;
};

export function WritingOverlay({ title, subtitle }: Props) {
  return (
    <div className={styles.backdrop} role="progressbar" aria-label={title}>
      <div className={styles.panel}>
        <div className={styles.animation}>
          <BookFlip size={160} />
        </div>
        <p className={styles.title}>{title}</p>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
    </div>
  );
}
