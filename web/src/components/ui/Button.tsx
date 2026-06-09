import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from './Spinner';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
};

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  leftIcon,
  disabled,
  children,
  className,
  ...rest
}: Props) {
  return (
    <button
      className={cx(
        styles.btn,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <Spinner size={size === 'lg' ? 20 : 18} tone={variant === 'primary' ? 'light' : 'dark'} />
      ) : (
        <>
          {leftIcon && <span className={styles.icon}>{leftIcon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
