import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ErrorBox } from '@/components/ui/error-box';
import { FONTS, SIZES } from '@/constants/colors';
import { usePalette } from '@/hooks/use-palette';
import { StoryPromptBackground } from './story-prompt-background';
import { StoryPromptHeader } from './story-prompt-header';
import { StoryPromptInputField } from './story-prompt-input-field';
import { StoryPromptSubmitButton } from './story-prompt-submit-button';
import { StoryWritingLoadingOverlay } from './story-writing-loading-overlay';
import type { StoryPromptScreenProps } from './story-prompt-types';
import { useStoryPromptLayout } from './use-story-prompt-layout';

export function StoryPromptScreen({
  insets,
  copy,
  prompt,
  onPromptChange,
  canSubmit,
  isPending,
  error,
  rawError,
  onSubmit,
  onBack,
}: StoryPromptScreenProps) {
  const c = usePalette();
  const layout = useStoryPromptLayout();

  return (
    <View style={[styles.container, { backgroundColor: c.paper }]}>
      <StoryPromptBackground />
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <StoryPromptHeader topInset={insets.top} onBack={onBack} />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: layout.contentPaddingTop,
              paddingBottom: Math.max(insets.bottom, 18) + 34,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.intro}>
            <Text style={[styles.headline, { color: c.ink }]}>{copy.headline}</Text>
            <Text style={[styles.subtext, { color: c.inkSoft }]}>{copy.subtext}</Text>
          </View>

          <View style={[styles.writingGroup, { marginTop: layout.writingMarginTop }]}>
            <StoryPromptInputField
              value={prompt}
              placeholder={copy.placeholder}
              minHeight={layout.inputMinHeight}
              onChangeText={onPromptChange}
              onClear={() => onPromptChange('')}
            />

            <Text style={[styles.hint, { color: c.inkSoft }]}>{copy.hint}</Text>

            {error ? (
              <View style={styles.errorSlot}>
                <ErrorBox error={error} originalError={rawError} onRetry={onSubmit} />
              </View>
            ) : null}

            <StoryPromptSubmitButton
              label={copy.startBtn}
              canSubmit={canSubmit}
              isPending={isPending}
              onPress={onSubmit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {isPending ? (
        <StoryWritingLoadingOverlay title={copy.loadingTitle} subtitle={copy.loadingSubtitle} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 22,
  },
  intro: {
    marginTop: 4,
  },
  headline: {
    fontFamily: FONTS.display,
    fontSize: SIZES['3xl'],
    lineHeight: 48,
    letterSpacing: 0,
  },
  subtext: {
    marginTop: 8,
    fontFamily: FONTS.serifItalic,
    fontSize: SIZES.md,
    lineHeight: 23,
  },
  writingGroup: {
    paddingHorizontal: 8,
  },
  hint: {
    marginTop: 8,
    marginBottom: 18,
    fontFamily: FONTS.sans,
    fontSize: SIZES.sm,
    lineHeight: 20,
  },
  errorSlot: {
    marginBottom: 18,
  },
});
