import { useState } from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { usePalette } from '@/hooks/use-palette';
import { FONTS, SIZES } from '@/constants/colors';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';

type Props = {
  variant?: Variant;
  children: string;
  onPress?: () => void;
  full?: boolean;
  disabled?: boolean;
};

export function Button({ variant = 'primary', children, onPress, full, disabled }: Props) {
  const c = usePalette();
  const [pressed, setPressed] = useState(false);

  const variantStyles: Record<Variant, ViewStyle & { color: string }> = {
    primary: { backgroundColor: c.thread, height: 52, paddingHorizontal: 24, color: '#fff' },
    secondary: { backgroundColor: c.paperSunk, height: 44, paddingHorizontal: 18, borderWidth: 1, borderColor: c.rule, color: c.ink },
    ghost: { backgroundColor: 'transparent', height: 44, paddingHorizontal: 12, color: c.thread },
    destructive: { backgroundColor: c.ember, height: 44, paddingHorizontal: 18, color: '#fff' },
  };

  const { color, ...containerStyle } = variantStyles[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.base,
        containerStyle,
        full && styles.full,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}>
      <Text style={[styles.label, { color }]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  full: {
    width: '100%',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontFamily: FONTS.sansMedium,
    fontSize: SIZES.md,
    letterSpacing: 0.1,
  },
});
