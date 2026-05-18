import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import { usePalette } from '@/hooks/use-palette';
import { FONTS, SIZES } from '@/constants/colors';
import type { SetupQuestion } from '@/constants/setup-questions';

type Props = {
  question: SetupQuestion;
  value: string;
  onChange: (value: string) => void;
};

export function SetupStep({ question, value, onChange }: Props) {
  const c = usePalette();
  const isCustom = value !== '' && !question.choices.includes(value);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: c.inkFaint }]}>{question.label}</Text>
      <Text style={[styles.question, { color: c.ink }]}>{question.question}</Text>

      <View style={styles.choices}>
        {question.choices.map(choice => {
          const selected = value === choice;
          return (
            <Pressable
              key={choice}
              onPress={() => onChange(selected ? '' : choice)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? c.thread : c.paperRaised,
                  borderColor: selected ? c.thread : c.rule,
                },
              ]}>
              <Text style={[styles.chipText, { color: selected ? c.paper : c.ink }]}>
                {choice}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.inputWrap, { borderColor: isCustom ? c.thread : c.rule }]}>
        <TextInput
          style={[styles.input, { color: c.ink }]}
          placeholder="또는 직접 입력…"
          placeholderTextColor={c.inkFaint}
          value={isCustom ? value : ''}
          onChangeText={text => onChange(text)}
          onFocus={() => {
            if (question.choices.includes(value)) onChange('');
          }}
          returnKeyType="done"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 20 },
  label: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  question: {
    fontFamily: FONTS.display,
    fontSize: SIZES['2xl'],
    lineHeight: 34,
    letterSpacing: 0,
    marginTop: -4,
  },
  choices: { gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: FONTS.sans,
    fontSize: SIZES.md,
    lineHeight: 20,
  },
  inputWrap: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 4,
  },
  input: {
    fontFamily: FONTS.sans,
    fontSize: SIZES.md,
    lineHeight: 20,
  },
});
