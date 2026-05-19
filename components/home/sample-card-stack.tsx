import { useCallback } from 'react';
import { View, ActivityIndicator, useWindowDimensions } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useCardStack } from '@/hooks/use-card-stack';
import { useSampleCards } from '@/hooks/use-sample-cards';
import { usePalette } from '@/hooks/use-palette';
import { CardItem } from './card-item';
import { STACK_OFFSET, STACK_HEIGHT_BUDGET } from '@/lib/sample-covers/constants';

type Props = {
  onCardPress?: (prompt: string) => void;
};

export function SampleCardStack({ onCardPress }: Props) {
  const { width, height } = useWindowDimensions();
  const c = usePalette();
  const { data: cards = [], isLoading } = useSampleCards();

  const handleTap = useCallback((frontIndex: number) => {
    const card = cards[frontIndex];
    if (card) onCardPress?.(card.prompt);
  }, [cards, onCardPress]);

  const { gesture, topIndex, swipeX, swipeY } = useCardStack(
    Math.max(cards.length, 1),
    handleTap,
  );

  const byWidth    = Math.round(width * 0.64);
  const byHeight   = Math.round((height * STACK_HEIGHT_BUDGET - STACK_OFFSET * 2) * (3 / 4));
  const cardWidth  = Math.min(byWidth, byHeight);
  const cardHeight = Math.round(cardWidth * (4 / 3));
  const containerW = cardWidth + STACK_OFFSET * 2;
  const containerH = cardHeight + STACK_OFFSET * 2;

  if (isLoading) {
    return (
      <View style={{ width: containerW, height: containerH, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={c.thread} />
      </View>
    );
  }

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ width: containerW, height: containerH }}>
        {cards.map((card, cardIndex) => (
          <CardItem
            key={card.id}
            card={card}
            cardIndex={cardIndex}
            totalCards={cards.length}
            topIndex={topIndex}
            swipeX={swipeX}
            swipeY={swipeY}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
          />
        ))}
      </View>
    </GestureDetector>
  );
}
