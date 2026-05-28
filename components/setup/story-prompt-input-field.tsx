import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { FONTS, SIZES } from '@/constants/colors';
import { usePalette } from '@/hooks/use-palette';

type Props = {
  value: string;
  placeholder: string;
  minHeight: number;
  onChangeText: (value: string) => void;
  onClear: () => void;
};

export function StoryPromptInputField({
  value,
  placeholder,
  minHeight,
  onChangeText,
  onClear,
}: Props) {
  const c = usePalette();
  const hasValue = value.trim().length > 0;

  return (
    <View style={[styles.sheet, { minHeight }]}>
      <View pointerEvents="none" style={styles.ruleStack}>
        <View style={styles.rule} />
        <View style={styles.rule} />
        <View style={styles.rule} />
        <View style={styles.rule} />
      </View>
      <TextInput
        style={[
          styles.input,
          {
            color: c.ink,
            minHeight: minHeight - 36,
            paddingRight: hasValue ? 30 : 0,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor="rgba(71,57,37,0.38)"
        value={value}
        onChangeText={onChangeText}
        multiline
        textAlignVertical="top"
        returnKeyType="default"
      />
      {hasValue ? (
        <Pressable onPress={onClear} hitSlop={8} style={styles.clearBtn}>
          <Icon name="close-circle" size={20} color="rgba(71,57,37,0.44)" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    paddingHorizontal: 8,
    paddingVertical: 18,
    position: 'relative',
  },
  ruleStack: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 60,
    gap: 36,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(96,72,42,0.14)',
  },
  input: {
    fontFamily: FONTS.cover,
    fontSize: SIZES.lg,
    lineHeight: 34,
  },
  clearBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
