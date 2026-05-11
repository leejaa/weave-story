import { Pressable, Text, StyleSheet } from 'react-native';
import { usePalette } from '@/hooks/use-palette';
import { FONTS, SIZES } from '@/constants/colors';

type Props = {
  children: string;
  on?: boolean;
  onPress?: () => void;
};

export function Chip({ children, on, onPress }: Props) {
  const c = usePalette();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.base,
        {
          borderColor: on ? c.thread : c.rule,
          backgroundColor: on ? c.thread : c.paper,
        },
      ]}>
      <Text style={[styles.label, { color: on ? '#fff' : c.inkSoft }]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontFamily: FONTS.sans,
    fontSize: SIZES.sm,
  },
});
