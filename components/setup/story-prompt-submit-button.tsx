import { Pressable, StyleSheet, Text } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { FONTS, SIZES } from '@/constants/colors';
import { usePalette } from '@/hooks/use-palette';

type Props = {
  label: string;
  canSubmit: boolean;
  isPending: boolean;
  onPress: () => void;
};

export function StoryPromptSubmitButton({ label, canSubmit, isPending, onPress }: Props) {
  const c = usePalette();
  const isDisabled = !canSubmit || isPending;
  const contentColor = canSubmit ? c.thread : 'rgba(71,57,37,0.42)';

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        {
          borderColor: canSubmit ? c.thread : 'rgba(92,71,45,0.2)',
          opacity: isPending ? 0.82 : 1,
        },
      ]}>
      <Text style={[styles.label, { color: contentColor }]}>{label}</Text>
      <Icon name="chevron-right" size={18} color={contentColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-end',
    minHeight: 48,
    borderBottomWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 2,
    paddingVertical: 10,
  },
  label: {
    fontFamily: FONTS.cover,
    fontSize: SIZES.lg,
  },
});
