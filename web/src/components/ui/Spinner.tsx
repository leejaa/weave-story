import styles from './Spinner.module.css';

type Props = {
  size?: number;
  tone?: 'light' | 'dark' | 'thread';
};

const TONE: Record<NonNullable<Props['tone']>, string> = {
  light: 'rgba(255, 255, 255, 0.9)',
  dark: 'var(--color-ink-soft)',
  thread: 'var(--color-thread)',
};

export function Spinner({ size = 20, tone = 'thread' }: Props) {
  return (
    <span
      className={styles.spinner}
      style={{
        width: size,
        height: size,
        borderWidth: Math.max(2, Math.round(size / 9)),
        color: TONE[tone],
      }}
      role="status"
      aria-label="로딩 중"
    />
  );
}
