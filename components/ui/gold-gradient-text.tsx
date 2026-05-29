import { StyleSheet, Text, type TextStyle } from 'react-native';
import {
  Canvas,
  Text as SkiaText,
  LinearGradient,
  useFont,
  vec,
} from '@shopify/react-native-skia';

const JUA = require('@expo-google-fonts/jua/400Regular/Jua_400Regular.ttf');

const GOLD_STOPS = ['#b6862a', '#e6c878', '#fff3c4', '#e0b35a', '#b6862a'];

type Props = {
  text: string;
  fontSize: number;
  lineHeight: number;
  fallbackColor: string;
};

export function GoldGradientText({ text, fontSize, lineHeight, fallbackColor }: Props) {
  const font = useFont(JUA, fontSize);

  if (!font) {
    const style: TextStyle = {
      fontFamily: 'Jua_400Regular',
      fontSize,
      lineHeight,
      color: fallbackColor,
      textAlign: 'center',
    };
    return <Text style={style}>{text}</Text>;
  }

  const width = font.measureText(text).width;
  const metrics = font.getMetrics();
  const glyphHeight = -metrics.ascent + metrics.descent;
  const baseline = (lineHeight - glyphHeight) / 2 - metrics.ascent;

  return (
    <Canvas style={[styles.canvas, { width: Math.ceil(width) + 4, height: lineHeight }]}>
      <SkiaText x={2} y={baseline} text={text} font={font}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(width, 0)}
          colors={GOLD_STOPS}
        />
      </SkiaText>
    </Canvas>
  );
}

const styles = StyleSheet.create({
  canvas: {
    alignSelf: 'center',
  },
});
