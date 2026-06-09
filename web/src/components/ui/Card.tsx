import type { HTMLAttributes } from 'react';
import styles from './Card.module.css';

type Props = HTMLAttributes<HTMLDivElement> & {
  as?: 'div' | 'button' | 'article';
  padded?: boolean;
  interactive?: boolean;
};

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

export function Card({
  as: Tag = 'div',
  padded = true,
  interactive = false,
  className,
  children,
  ...rest
}: Props) {
  return (
    <Tag
      className={cx(styles.card, padded && styles.padded, interactive && styles.interactive, className)}
      {...(rest as Record<string, unknown>)}
    >
      {children}
    </Tag>
  );
}
