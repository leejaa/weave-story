/* 개발용 디자인 시스템 갤러리 — 프로덕션 번들(index.html)에는 포함되지 않음.
   gallery.html 진입점으로만 렌더된다. */
import { Button, Card, Tag, Spinner, TopBar, Screen } from '@/components/ui';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 12, color: 'var(--color-ink)' }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>{children}</div>
    </section>
  );
}

export function Gallery() {
  return (
    <Screen header={<TopBar title="디자인 시스템" onBack={() => {}} action={<Tag tone="gold">크레딧 10</Tag>} />}>
      <div style={{ paddingBottom: 40 }}>
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
