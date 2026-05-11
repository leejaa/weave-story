import { View, Text, TextInput, StyleSheet } from 'react-native';
import { usePalette } from '@/hooks/use-palette';
import { FONTS, SIZES } from '@/constants/colors';

type Props = {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
};

export function Field({ label, placeholder, value, onChangeText, multiline }: Props) {
  const c = usePalette();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: c.inkSoft }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.inkFaint}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        style={[
          styles.input,
          multiline && styles.multiline,
          {
            color: c.ink,
            backgroundColor: c.paper,
            borderColor: c.rule,
            fontFamily: multiline ? FONTS.serif : FONTS.sans,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontFamily: FONTS.sansSemibold,
    fontSize: SIZES.xs,
    letterSpacing: 0.6,
  },
  input: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: SIZES.md,
  },
  multiline: {
    height: 96,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
});
