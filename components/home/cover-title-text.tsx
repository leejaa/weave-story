import { StyleSheet, Text, View } from 'react-native';
import { FONTS } from '@/constants/colors';

type Props = {
  title: string;
};

export function CoverTitleText({ title }: Props) {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <Text style={[styles.title, styles.strokeHeavy]} numberOfLines={3} allowFontScaling={false}>
        {title}
      </Text>
      <Text style={[styles.title, styles.strokeWarm]} numberOfLines={3} allowFontScaling={false}>
        {title}
      </Text>
      <Text style={styles.title} numberOfLines={3} allowFontScaling={false}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 22,
    right: 12,
    bottom: 22,
    transform: [{ rotateZ: '-1deg' }],
  },
  title: {
    fontFamily: FONTS.cover,
    fontSize: 23,
    lineHeight: 30,
    color: '#fffaf0',
    textAlign: 'left',
    textShadowColor: 'rgba(0,0,0,0.82)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  strokeHeavy: {
    position: 'absolute',
    left: 2,
    top: 3,
    color: 'rgba(0,0,0,0.72)',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  strokeWarm: {
    position: 'absolute',
    left: -1,
    top: -1,
    color: 'rgba(255,214,142,0.34)',
    textShadowColor: 'rgba(255,230,166,0.44)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
});
