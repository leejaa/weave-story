import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChoiceTile } from '@/components/choice-tile';
import { usePalette } from '@/hooks/use-palette';
import { FONTS, SIZES } from '@/constants/colors';
import type { ChapterOption } from '@/lib/api/types';

type Props = {
  options: ChapterOption[];
  situation: string | null;
  question: string | null;
  chapterNumber: number;
  onChoose: (
    chapterNumber: number,
    selection: { choiceIndex: number } | { customInput: string },
  ) => Promise<void>;
  choosing: boolean;
};

export function ChoicePage({ options, situation, question, chapterNumber, onChoose, choosing }: Props) {
  const c = usePalette();
  const { t } = useTranslation('reading');
  const insets = useSafeAreaInsets();
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [customInput, setCustomInput] = useState('');

  const canConfirm = selectedChoice !== null || customInput.trim().length > 0;

  const handleChoiceSelect = useCallback((index: number) => {
    setSelectedChoice(prev => (prev === index ? null : index));
    setCustomInput('');
  }, []);

  const handleCustomChange = useCallback((text: string) => {
    setCustomInput(text);
    if (text.trim().length > 0) setSelectedChoice(null);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!canConfirm || choosing) return;
    const selection =
      customInput.trim().length > 0
        ? { customInput: customInput.trim() }
        : { choiceIndex: selectedChoice! };
    await onChoose(chapterNumber, selection);
  }, [canConfirm, choosing, customInput, selectedChoice, chapterNumber, onChoose]);

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">

      <View style={styles.top}>
        {situation ? (
          <Text style={[styles.situation, { color: c.inkSoft }]}>{situation}</Text>
        ) : null}
        <Text style={[styles.headline, { color: c.ink }]}>
          {question || t('choice.defaultQuestion')}
        </Text>
      </View>

      <View style={styles.choices}>
        {options.map(opt => (
          <ChoiceTile
            key={opt.index}
            marker={String.fromCharCode(65 + opt.index)}
            text={opt.text}
            selected={selectedChoice === opt.index}
            faded={selectedChoice !== null && selectedChoice !== opt.index}
            onPress={() => handleChoiceSelect(opt.index)}
          />
        ))}
      </View>

      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: c.rule }]} />
        <Text style={[styles.dividerLabel, { color: c.inkFaint }]}>{t('choice.orInput')}</Text>
        <View style={[styles.dividerLine, { backgroundColor: c.rule }]} />
      </View>

      <View
        style={[
          styles.inputWrap,
          {
            borderColor: customInput.trim() ? c.thread : c.rule,
            backgroundColor: c.paperRaised,
          },
        ]}>
        <TextInput
          style={[styles.input, { color: c.ink }]}
          placeholder={t('choice.inputPlaceholder')}
          placeholderTextColor={c.inkFaint}
          value={customInput}
          onChangeText={handleCustomChange}
          returnKeyType="done"
        />
      </View>

      <Pressable
        onPress={handleConfirm}
        disabled={!canConfirm || choosing}
        style={[styles.cta, { backgroundColor: canConfirm ? c.thread : c.paperSunk }]}>
        {choosing ? (
          <ActivityIndicator color={c.paper} size="small" />
        ) : (
          <Text style={[styles.ctaLabel, { color: canConfirm ? c.paper : c.inkFaint }]}>
            {t('choice.continue')}
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
    gap: 16,
  },
  top: {
    gap: 10,
    marginBottom: 8,
  },
  situation: {
    fontFamily: FONTS.serifItalic,
    fontSize: SIZES.md,
    lineHeight: 26,
  },
  headline: {
    fontFamily: FONTS.serifSemibold,
    fontSize: SIZES['2xl'],
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  choices: { gap: 8 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  inputWrap: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  input: {
    fontFamily: FONTS.sans,
    fontSize: SIZES.sm,
    lineHeight: 20,
  },
  cta: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  ctaLabel: {
    fontFamily: FONTS.sansSemibold,
    fontSize: SIZES.md,
    letterSpacing: 0.2,
  },
});
