import { useCallback, useRef } from 'react';
import type { ScrollView, View } from 'react-native';

const INPUT_TOP_PADDING = 18;

export function useChoiceInputScroll() {
  const scrollRef = useRef<ScrollView>(null);
  const inputWrapRef = useRef<View>(null);

  const scrollInputIntoView = useCallback(() => {
    const scrollNode = scrollRef.current;
    const inputNode = inputWrapRef.current;
    if (!scrollNode || !inputNode) return;

    requestAnimationFrame(() => {
      inputNode.measureLayout(
        scrollNode as unknown as number,
        (_x, y) => {
          scrollNode.scrollTo({
            y: Math.max(0, y - INPUT_TOP_PADDING),
            animated: true,
          });
        },
        () => {
          scrollNode.scrollToEnd({ animated: true });
        },
      );
    });
  }, []);

  return {
    scrollRef,
    inputWrapRef,
    scrollInputIntoView,
  };
}
