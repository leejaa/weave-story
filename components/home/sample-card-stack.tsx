import { View, useWindowDimensions } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useCardStack } from '@/hooks/use-card-stack';
import { CardItem } from './card-item';
import { SAMPLE_CARDS, STACK_OFFSET, STACK_HEIGHT_BUDGET } from '@/lib/sample-covers/constants';

export function SampleCardStack() {
  const { width, height } = useWindowDimensions();
  const { gesture, topIndex, swipeX, swipeY } = useCardStack();

  const byWidth    = Math.round(width * 0.64);
  const byHeight   = Math.round((height * STACK_HEIGHT_BUDGET - STACK_OFFSET * 2) * (3 / 4));
  const cardWidth  = Math.min(byWidth, byHeight);
  const cardHeight = Math.round(cardWidth * (4 / 3));
  const containerW = cardWidth + STACK_OFFSET * 2;
  const containerH = cardHeight + STACK_OFFSET * 2;

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ width: containerW, height: containerH }}>
        {SAMPLE_CARDS.map((card, cardIndex) => (
          <CardItem
            key={card.genre}
            card={card}
            cardIndex={cardIndex}
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
