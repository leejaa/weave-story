import { Pressable, StyleSheet, Text } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { FONTS, SIZES } from '@/constants/colors';
import { usePalette } from '@/hooks/use-palette';

type Props = {
  label: string;
  pendingLabel: string;
  canSubmit: boolean;
  isPending: boolean;
  onPress: () => void;
};

export function StoryPromptSubmitButton({
  label,
  pendingLabel,
  canSubmit,
  isPending,
  onPress,
}: Props) {
  const c = usePalette();
  const isDisabled = !canSubmit || isPending;
  const contentColor = canSubmit || isPending ? c.thread : 'rgba(71,57,37,0.42)';
  const displayLabel = isPending ? pendingLabel : label;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        {
          borderColor: canSubmit || isPending ? c.thread : 'rgba(92,71,45,0.2)',
          opacity: isPending ? 0.72 : 1,
        },
      ]}>
      <Text style={[styles.label, { color: contentColor }]}>{displayLabel}</Text>
      {isPending ? null : <Icon name="chevron-right" size={18} color={contentColor} />}
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
