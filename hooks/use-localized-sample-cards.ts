import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSampleCards } from '@/hooks/use-sample-cards';
import type { SampleCardData } from '@/lib/api/types';

function localizeSampleCard(
  card: SampleCardData,
  t: (key: string, fallback: string) => string,
): SampleCardData {
  const baseKey = `sampleCards.${card.genre}`;

  return {
    ...card,
    genreLabel: t(`${baseKey}.genreLabel`, card.genreLabel),
    title: t(`${baseKey}.title`, card.title),
    prompt: t(`${baseKey}.prompt`, card.prompt),
  };
}

export function useLocalizedSampleCards() {
  const query = useSampleCards();
  const { t } = useTranslation('home');

  const data = useMemo(
    () => query.data?.map((card) => localizeSampleCard(card, t)) ?? [],
    [query.data, t],
  );

  return {
    ...query,
    data,
  };
}
