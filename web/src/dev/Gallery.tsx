/* 개발용 디자인 시스템 갤러리 — 프로덕션 번들(index.html)에는 포함되지 않음.
   gallery.html 진입점으로만 렌더된다. */
import { Button, Card, Tag, Spinner, TopBar, Screen } from '@/components/ui';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: 18, marginBottom: 12, color: 'var(--color-ink)' }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>{children}</div>
    </section>
  );
}

const FONT_SPECS = [
  { label: 'serif · Fraunces (본문·스토리)', font: 'var(--font-serif)', sample: 'Weave Story — 공작이 나를 선택했다', weight: 400 },
  { label: 'serif 600 · 워드마크', font: 'var(--font-serif)', sample: 'Weave Story', weight: 600 },
  { label: 'sans · Plus Jakarta Sans (UI)', font: 'var(--font-sans)', sample: 'Start story · 이야기 시작하기', weight: 500 },
  { label: 'display · Black Han Sans (한글 헤드라인)', font: 'var(--font-display)', sample: '세상에 하나뿐인 이야기', weight: 400 },
  { label: 'cover · Jua (커버·브랜딩)', font: 'var(--font-cover)', sample: '오늘 밤을 위한 한 권', weight: 400 },
  { label: 'mono · DM Mono (페이지번호)', font: 'var(--font-mono)', sample: '3 / 8  ·  Ch.4  ·  2026', weight: 400 },
];

export function Gallery() {
  return (
    <Screen header={<TopBar title="디자인 시스템" onBack={() => {}} action={<Tag tone="gold">크레딧 10</Tag>} />}>
      <div style={{ paddingBottom: 40 }}>
        <Section title="Fonts — Expo 앱과 통일">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
            {FONT_SPECS.map((f) => (
              <div key={f.label}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-faint)', marginBottom: 2 }}>
                  {f.label}
                </div>
                <div style={{ fontFamily: f.font, fontWeight: f.weight, fontSize: 22, color: 'var(--color-ink)', lineHeight: 1.3 }}>
                  {f.sample}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Button — variant">
          <Button variant="primary">primary</Button>
          <Button variant="secondary">secondary</Button>
          <Button variant="ghost">ghost</Button>
        </Section>

        <Section title="Button — size / state">
          <Button size="md">md</Button>
          <Button size="lg">lg</Button>
          <Button loading>loading</Button>
          <Button disabled>disabled</Button>
        </Section>

        <Section title="Button — fullWidth">
          <Button size="lg" fullWidth>토스로 시작하기</Button>
        </Section>

        <Section title="Tag">
          <Tag tone="thread">로맨스</Tag>
          <Tag tone="gold">완결</Tag>
          <Tag tone="neutral">Ch.4</Tag>
        </Section>

        <Section title="Spinner">
          <Spinner size={18} tone="thread" />
          <Spinner size={28} tone="thread" />
          <Spinner size={28} tone="dark" />
        </Section>

        <Section title="Card">
          <Card>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, marginBottom: 6 }}>공작이 나를 선택했다</div>
            <div style={{ color: 'var(--color-ink-soft)', fontSize: 13 }}>로판 · Ch.4 · 50% 진행</div>
          </Card>
          <Card interactive>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, marginBottom: 6 }}>탭 가능한 카드</div>
            <div style={{ color: 'var(--color-ink-soft)', fontSize: 13 }}>interactive · 눌러보세요</div>
          </Card>
        </Section>
      </div>
    </Screen>
  );
}
