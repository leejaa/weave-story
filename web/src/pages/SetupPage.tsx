import { useLocation, useNavigate } from 'react-router-dom';
import { Screen, TopBar, Card, Button } from '@/components/ui';
import type { SampleCardData } from '@/lib/types';

type SetupState = { prompt?: string; card?: SampleCardData };

/** Task 5에서 본격 구현 — 지금은 홈에서 넘어온 프롬프트를 확인하는 플레이스홀더. */
export function SetupPage() {
  const navigate = useNavigate();
  const { prompt, card } = (useLocation().state ?? {}) as SetupState;

  return (
    <Screen
      header={<TopBar title="새 이야기" onBack={() => navigate('/')} />}
      footer={<Button size="lg" fullWidth disabled>이야기 시작하기 (Task 5)</Button>}
    >
      <div style={{ paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {card && (
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--color-ink)', whiteSpace: 'pre-line' }}>
            {card.title}
          </div>
        )}
        <Card>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-faint)', marginBottom: 8 }}>
            선택한 프롬프트
          </div>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, lineHeight: 1.6, color: 'var(--color-ink)' }}>
            {prompt ?? '홈에서 카드를 선택하면 프롬프트가 채워져요.'}
          </p>
        </Card>
      </div>
    </Screen>
  );
}
