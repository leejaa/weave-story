import type { SampleCardData } from '@/lib/types';
import type { ExpandRect } from '@/features/expand/BookExpand';
import { useBookExpand } from '@/features/expand/BookExpand';
import { useSampleCards } from '@/features/home/useSampleCards';
import { HomeBackground } from '@/components/home/HomeBackground';
import { HomeHeadline } from '@/components/home/HomeHeadline';
import { BookRail } from '@/components/home/BookRail';
import styles from './HomePage.module.css';

export function HomePage() {
  const { data: cards } = useSampleCards();
  const { start } = useBookExpand();

  const handleSelect = (card: SampleCardData, rect: ExpandRect | null) => {
    // 카드 커버가 풀스크린으로 확대 → 펼친 책 미리보기로 전환
    start(card, rect);
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
