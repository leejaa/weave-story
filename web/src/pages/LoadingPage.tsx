import { Spinner } from '@/components/ui';
import styles from './LoadingPage.module.css';

export function LoadingPage() {
  return (
    <div className={styles.root}>
      <Spinner size={32} tone="thread" />
    </div>
  );
}
