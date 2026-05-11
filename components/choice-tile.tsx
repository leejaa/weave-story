import { View, Text, Pressable, StyleSheet } from 'react-native';
import { usePalette } from '@/hooks/use-palette';
import { FONTS, SIZES } from '@/constants/colors';

type Props = {
  marker: string;
  text: string;
  selected?: boolean;
  faded?: boolean;
  onPress?: () => void;
};

export function ChoiceTile({ marker, text, selected, faded, onPress }: Props) {
  const c = usePalette();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tile,
        {
          borderColor: selected ? c.thread : c.rule,
          borderLeftWidth: selected ? 2 : 1,
          backgroundColor: selected ? c.threadSoft : c.paper,
          opacity: faded ? 0.5 : 1,
        },
      ]}>
      <View
        style={[
          styles.marker,
          {
            backgroundColor: selected ? c.thread : c.paperSunk,
          },
        ]}>
        <Text style={[styles.markerText, { color: selected ? '#fff' : c.inkFaint }]}>
          {marker}
        </Text>
      </View>
      <Text style={[styles.text, { color: c.ink }]}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 14,
    paddingLeft: 15,
    borderRadius: 12,
    borderWidth: 1,
  },
  marker: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    flexShrink: 0,
    marginTop: 2,
  },
  markerText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
  },
  text: {
    flex: 1,
    fontFamily: FONTS.serif,
    fontSize: SIZES.lg,
    lineHeight: 24,
  },
});
