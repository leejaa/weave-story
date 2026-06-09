import type { ReactNode } from 'react';
import styles from './Tag.module.css';

type Tone = 'thread' | 'gold' | 'neutral';

type Props = {
  children: ReactNode;
  tone?: Tone;
};

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

export function Tag({ children, tone = 'thread' }: Props) {
  return <span className={cx(styles.tag, styles[tone])}>{children}</span>;
}
