import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/icon';
import { useTranslation } from 'react-i18next';
import { usePalette } from '@/hooks/use-palette';
import { useStoryPrompt } from '@/hooks/use-story-prompt';
import { ErrorBox } from '@/components/ui/error-box';
import { FONTS, SIZES } from '@/constants/colors';

export default function SetupScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('weave');
  const { prompt, setPrompt, canSubmit, isPending, error, rawError, submit, back } = useStoryPrompt();

  return (
    <View style={[styles.container, { backgroundColor: c.paper }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={back} hitSlop={12} style={styles.backBtn}>
          <Icon name="chevron-left" size={24} color={c.inkSoft} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        <Text style={[styles.headline, { color: c.ink }]}>{t('headline')}</Text>
        <Text style={[styles.subtext, { color: c.inkSoft }]}>{t('subtext')}</Text>

        {/* Free text input */}
        <View style={[styles.inputWrap, { borderColor: prompt.trim() ? c.thread : c.rule, backgroundColor: c.paperRaised }]}>
          <TextInput
            style={[styles.input, { color: c.ink }]}
            placeholder={t('placeholder')}
            placeholderTextColor={c.inkFaint}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            textAlignVertical="top"
            returnKeyType="default"
          />
        </View>
        <Text style={[styles.hint, { color: c.inkFaint }]}>{t('hint')}</Text>
      </ScrollView>

      {error ? (
        <ErrorBox error={error} originalError={rawError} onRetry={submit} />
      ) : null}

      {/* Footer CTA */}
      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 16) + 8, borderTopColor: c.rule },
        ]}>
        <Pressable
          onPress={submit}
          disabled={!canSubmit || isPending}
          style={[styles.cta, { backgroundColor: canSubmit ? c.thread : c.paperSunk }]}>
          {isPending ? (
            <ActivityIndicator color={c.paper} />
          ) : (
            <>
              <Text style={[styles.ctaLabel, { color: canSubmit ? c.paper : c.inkFaint }]}>
                {t('startBtn')}
              </Text>
              <Icon name="chevron-right" size={18} color={canSubmit ? c.paper : c.inkFaint} />
            </>
          )}
        </Pressable>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backBtn: {},
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 16 },
  headline: {
    fontFamily: FONTS.display,
    fontSize: SIZES['3xl'],
    lineHeight: 48,
    letterSpacing: 0,
    marginBottom: 8,
  },
  subtext: {
    fontFamily: FONTS.serifItalic,
    fontSize: SIZES.md,
    lineHeight: 22,
    marginBottom: 24,
  },
  inputWrap: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    minHeight: 130,
    marginBottom: 10,
  },
  input: {
    fontFamily: FONTS.sans,
    fontSize: SIZES.md,
    lineHeight: 24,
    minHeight: 100,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
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
  hint: {
    fontFamily: FONTS.sans,
    fontSize: SIZES.sm,
    lineHeight: 20,
    marginBottom: 32,
  },
});
