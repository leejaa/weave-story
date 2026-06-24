import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSampleCards } from '@/hooks/use-sample-cards';
import type { SampleCardData } from '@/lib/api/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TFn = (key: string, options?: any) => any;

function localizeSampleCard(
  card: SampleCardData,
  t: TFn,
): SampleCardData {
  const baseKey = `sampleCards.${card.genre}`;
  const genreLabel = t(`${baseKey}.genreLabel`, { defaultValue: card.genreLabel });

  // 1순위: 서버 DB의 {제목, 본문} 쌍 풀. 한 쌍을 랜덤 선택해 제목·프롬프트를 함께 고정한다
  // (제목과 내용이 일치하도록). 카드 목록 재계산(remount/언어변경)마다 새로 뽑힌다.
  if (card.samples?.length) {
    const pick = card.samples[Math.floor(Math.random() * card.samples.length)];
    return {
      ...card,
      genreLabel,
      title: pick.title || t(`${baseKey}.title`, { defaultValue: card.title }),
      prompt: pick.body,
      prompts: [pick.body],
    };
  }

  // 폴백(구 데이터/오프라인): 로케일 프롬프트 풀 → 카드 기본값.
  const rawPrompts = t(`${baseKey}.prompts`, { returnObjects: true, defaultValue: null });
  const prompts: string[] = card.prompts?.length
    ? card.prompts
    : Array.isArray(rawPrompts) && rawPrompts.length > 0
      ? rawPrompts
      : [t(`${baseKey}.prompt`, { defaultValue: card.prompt })];

  return {
    ...card,
    genreLabel,
    title: t(`${baseKey}.title`, { defaultValue: card.title }),
    prompt: prompts[0],
    prompts,
  };
}

export function useLocalizedSampleCards() {
  const query = useSampleCards();
  const { t } = useTranslation('home');

  const data = useMemo(
    () => query.data?.map((card) => localizeSampleCard(card, t as TFn)) ?? [],
    [query.data, t],
  );

  return {
    ...query,
    data,
  };
}
