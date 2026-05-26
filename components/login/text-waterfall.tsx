import React, { useEffect } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { FONTS } from '@/constants/colors';

const LINES = [
  'once upon a time',
  'in a kingdom far away',
  'she opened the old book',
  'the story had just begun',
  'a choice must be made',
  'darkness fell upon the land',
  'he whispered her name',
  'the door stood ajar',
  'the thread unraveled',
  'an unknown path ahead',
  'silence before the storm',
  'fate intervened',
  'a new chapter begins',
  'the ink still wet',
  'who will you become',
  'the ending is yours',
  'turn the page',
  'chapter one',
  'woven in time',
  'her heart raced',
  'the map led here',
  'words on the page',
];

const LINE_HEIGHT = 28;
const BG = '#0D0B10';

function seeded(n: number) {
  const x = Math.sin(n + 1) * 10000;
  return x - Math.floor(x);
}

function shuffle(arr: string[], seed: number): string[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(seeded(seed + i) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

type ColumnProps = {
  lines: string[];
  x: number;
  duration: number;
  initialOffset: number;
  opacity: number;
  fontSize: number;
};

function Column({ lines, x, duration, initialOffset, opacity, fontSize }: ColumnProps) {
  const { height } = useWindowDimensions();
  const blockHeight = lines.length * LINE_HEIGHT;
  const translateY = useSharedValue(initialOffset);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(initialOffset - blockHeight, { duration, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // 텍스트 블록 3번 반복으로 seamless loop 보장
  const repeated = [...lines, ...lines, ...lines];

  return (
    <Animated.View style={[styles.column, { left: x }, style]}>
      {repeated.map((line, i) => (
        <Text
          key={i}
          style={[
            styles.line,
            { opacity: opacity * (0.4 + seeded(i * 7) * 0.6), fontSize },
          ]}>
          {line}
        </Text>
      ))}
    </Animated.View>
  );
}

export function TextWaterfall() {
  const { width, height } = useWindowDimensions();

  const columnCount = Math.floor(width / 130);
  const colWidth = width / columnCount;

  const columns = Array.from({ length: columnCount }, (_, i) => {
    const lines = shuffle(LINES, i * 13);
    const blockHeight = lines.length * LINE_HEIGHT;
    return {
      lines,
      x: i * colWidth,
      duration: 12000 + seeded(i * 5) * 10000,
      initialOffset: -seeded(i * 3) * blockHeight,
      opacity: 0.18 + seeded(i * 7) * 0.22,
      fontSize: 11 + seeded(i * 11) * 4,
    };
  });

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: BG, overflow: 'hidden' }]}>
      {columns.map((col, i) => (
        <Column key={i} {...col} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    position: 'absolute',
    top: 0,
  },
  line: {
    color: '#c8b8ce',
    fontFamily: FONTS.serifItalic,
    lineHeight: LINE_HEIGHT,
    paddingHorizontal: 8,
  },
});
