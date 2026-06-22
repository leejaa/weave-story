import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChoiceTile } from '@/components/choice-tile';
import { usePalette } from '@/hooks/use-palette';
import { FONTS, SIZES } from '@/constants/colors';
import type { ChapterOption } from '@/lib/api/types';
import { useChoiceInputScroll } from './use-choice-input-scroll';

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
  const { scrollRef, inputWrapRef, scrollInputIntoView } = useChoiceInputScroll();
  // 'choices': A·B·직접입력 버튼 노출 / 'input': 직접입력란만 크게 확장.
  const [mode, setMode] = useState<'choices' | 'input'>('choices');
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [customInput, setCustomInput] = useState('');

  const canConfirm = mode === 'input' ? customInput.trim().length > 0 : selectedChoice !== null;

  const handleChoiceSelect = useCallback((index: number) => {
    setSelectedChoice(prev => (prev === index ? null : index));
  }, []);

  const enterInput = useCallback(() => {
    setSelectedChoice(null);
    setMode('input');
  }, []);

  const backToChoices = useCallback(() => {
    setMode('choices');
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!canConfirm || choosing) return;
    const selection =
      mode === 'input'
        ? { customInput: customInput.trim() }
        : { choiceIndex: selectedChoice! };
    await onChoose(chapterNumber, selection);
  }, [canConfirm, choosing, mode, customInput, selectedChoice, chapterNumber, onChoose]);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.page}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      nestedScrollEnabled>

        <View style={styles.top}>
          {situation ? (
            <Text style={[styles.situation, { color: c.inkSoft }]}>{situation}</Text>
          ) : null}
          <Text style={[styles.headline, { color: c.ink }]}>
            {question || t('choice.defaultQuestion')}
          </Text>
        </View>

        {mode === 'choices' ? (
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
            <ChoiceTile
              marker="✎"
              text={t('choice.customButton')}
              onPress={enterInput}
            />
          </View>
        ) : (
          <View style={styles.inputMode}>
            <Pressable onPress={backToChoices} hitSlop={8} style={styles.backRow}>
              <Text style={[styles.backLabel, { color: c.inkSoft }]}>‹ {t('choice.backToChoices')}</Text>
            </Pressable>
            <View
              ref={inputWrapRef}
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
                onChangeText={setCustomInput}
                onFocus={scrollInputIntoView}
                autoFocus
                multiline
                textAlignVertical="top"
                returnKeyType="default"
                blurOnSubmit={false}
              />
            </View>
          </View>
        )}

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
  inputMode: { gap: 12 },
  backRow: {
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  backLabel: {
    fontFamily: FONTS.sansSemibold,
    fontSize: SIZES.sm,
    letterSpacing: 0.2,
  },
  inputWrap: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 200,
  },
  input: {
    fontFamily: FONTS.sans,
    fontSize: SIZES.md,
    lineHeight: 24,
    minHeight: 176,
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
