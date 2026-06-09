import { useState } from 'react';
import { Button } from '@/components/ui';
import styles from './LoginPage.module.css';

type Props = {
  onLogin: () => Promise<void>;
};

export function LoginPage({ onLogin }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await onLogin();
    } catch {
      setError('로그인에 실패했어요. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Weave Story</h1>
        <p className={styles.subtitle}>나만의 이야기를 엮어가세요</p>
      </div>

      <div className={styles.bottom}>
        {error && <p className={styles.error}>{error}</p>}
        <Button size="lg" fullWidth loading={loading} onClick={handleLogin}>
          토스로 시작하기
        </Button>
      </div>
    </div>
  );
}
