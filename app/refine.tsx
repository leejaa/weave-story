import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/icon';
import { useTranslation } from 'react-i18next';
import { usePalette } from '@/hooks/use-palette';
import { useRefineFlow } from '@/hooks/use-refine-flow';
import { ErrorBox } from '@/components/ui/error-box';
import { FONTS, SIZES } from '@/constants/colors';

export default function RefineScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('weave');
  const { prompt, questions: questionsJson } =
    useLocalSearchParams<{ prompt: string; questions: string }>();

  const questions = JSON.parse(questionsJson ?? '[]') as string[];
  const { step, totalSteps, question, answer, setAnswer, isLastStep, isPending, error, rawError, proceed, back } =
    useRefineFlow(prompt ?? '', questions);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.paper }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={back} hitSlop={12} style={styles.backBtn}>
          <Icon name="chevron-left" size={24} color={c.inkSoft} />
        </Pressable>
      </View>

      {/* Step indicator */}
      <View style={styles.stepBar}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.stepSegment,
              { backgroundColor: i <= step ? c.thread : c.rule },
            ]}
          />
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.eyebrow, { color: c.inkFaint }]}>
          {t('refine_label')}
        </Text>
        <Text style={[styles.question, { color: c.ink }]}>{question}</Text>

        <View
          style={[
            styles.inputWrap,
            { borderColor: answer.trim() ? c.thread : c.rule, backgroundColor: c.paperRaised },
          ]}>
          <TextInput
            style={[styles.input, { color: c.ink }]}
            placeholder={t('refine_placeholder')}
            placeholderTextColor={c.inkFaint}
            value={answer}
            onChangeText={setAnswer}
            multiline
            textAlignVertical="top"
            autoFocus
          />
        </View>
      </View>

      {error ? (
        <ErrorBox error={error} originalError={rawError} onRetry={proceed} />
      ) : null}

      {/* Footer */}
      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 16) + 8, borderTopColor: c.rule },
        ]}>
        <Pressable
          onPress={proceed}
          disabled={isPending}
          style={[styles.cta, { backgroundColor: c.thread }]}>
          {isPending ? (
            <ActivityIndicator color={c.paper} />
          ) : (
            <>
              <Text style={[styles.ctaLabel, { color: c.paper }]}>
                {isLastStep ? t('startBtn') : t('refine_next')}
              </Text>
              <Icon name="chevron-right" size={18} color={c.paper} />
            </>
          )}
        </Pressable>

        {!isLastStep && (
          <Pressable onPress={proceed} disabled={isPending} style={styles.skipBtn}>
            <Text style={[styles.skipLabel, { color: c.inkFaint }]}>{t('refine_skip')}</Text>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backBtn: {},
  stepBar: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  stepSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  eyebrow: {
    fontFamily: FONTS.sansMedium,
    fontSize: SIZES.sm,
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  question: {
    fontFamily: FONTS.display,
    fontSize: SIZES['2xl'],
    lineHeight: 36,
    letterSpacing: 0,
    marginBottom: 24,
  },
  inputWrap: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
  },
  input: {
    fontFamily: FONTS.sans,
    fontSize: SIZES.md,
    lineHeight: 24,
    minHeight: 88,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    borderRadius: 14,
  },
  ctaLabel: {
    fontFamily: FONTS.sansSemibold,
    fontSize: SIZES.md,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipLabel: {
    fontFamily: FONTS.sans,
    fontSize: SIZES.sm,
  },
});
