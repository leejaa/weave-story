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
  // 프롬프트 풀은 서버 DB(card.prompts)가 단일 소스. 비어 있으면 로케일 → 카드 기본값 순으로 폴백.
  const rawPrompts = t(`${baseKey}.prompts`, { returnObjects: true, defaultValue: null });
  const prompts: string[] = card.prompts?.length
    ? card.prompts
    : Array.isArray(rawPrompts) && rawPrompts.length > 0
      ? rawPrompts
      : [t(`${baseKey}.prompt`, { defaultValue: card.prompt })];

  return {
    ...card,
    genreLabel: t(`${baseKey}.genreLabel`, { defaultValue: card.genreLabel }),
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
