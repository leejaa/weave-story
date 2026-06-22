import type { SampleCardData } from '@/lib/types';
import type { ExpandRect } from '@/features/expand/BookExpand';
import { useBookExpand } from '@/features/expand/BookExpand';
import { useSampleCards } from '@/features/home/useSampleCards';
import { SAMPLE_PROMPTS } from '@/features/home/sample-prompts';
import { HomeBackground } from '@/components/home/HomeBackground';
import { HomeHeadline } from '@/components/home/HomeHeadline';
import { BookRail } from '@/components/home/BookRail';
import styles from './HomePage.module.css';

export function HomePage() {
  const { data: cards } = useSampleCards();
  const { start } = useBookExpand();

  const handleSelect = (card: SampleCardData, rect: ExpandRect | null) => {
    // 탭마다 해당 장르 프롬프트 풀에서 랜덤 선택(Expo 동작과 일치). 풀 없으면 카드 기본 prompt.
    const pool = SAMPLE_PROMPTS[card.genre] ?? [card.prompt];
    const prompt = pool[Math.floor(Math.random() * pool.length)];
    // 카드 커버가 풀스크린으로 확대 → 펼친 책 미리보기로 전환
    start({ ...card, prompt }, rect);
  };

  return (
    <div className={styles.screen}>
      <HomeBackground />
      <div className={styles.content}>
        <HomeHeadline />
        <div className={styles.railWrap}>
          <BookRail cards={cards} onSelect={handleSelect} />
        </div>
      </div>
    </div>
  );
}
