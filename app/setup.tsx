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
import { usePalette } from '@/hooks/use-palette';
import { useStoryPrompt } from '@/hooks/use-story-prompt';
import { ARCHETYPES } from '@/constants/story-archetypes';
import { FONTS, SIZES } from '@/constants/colors';

export default function SetupScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const { prompt, setPrompt, canSubmit, isPending, error, submit, back } = useStoryPrompt();

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

        <Text style={[styles.headline, { color: c.ink }]}>
          어떤 이야기를{'\n'}원하세요?
        </Text>
        <Text style={[styles.subtext, { color: c.inkSoft }]}>
          원하는 이야기를 자유롭게 설명해주세요.
        </Text>

        {/* Free text input */}
        <View style={[styles.inputWrap, { borderColor: prompt.trim() ? c.thread : c.rule, backgroundColor: c.paperRaised }]}>
          <TextInput
            style={[styles.input, { color: c.ink }]}
            placeholder="예) 마법사 학교에 입학한 소녀가 금지된 주문을 발견하는 이야기…"
            placeholderTextColor={c.inkFaint}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            textAlignVertical="top"
            returnKeyType="default"
          />
        </View>

        {/* Archetype quick-pick */}
        <Text style={[styles.sectionLabel, { color: c.inkFaint }]}>빠른 시작</Text>
        <View style={styles.cardGrid}>
          {ARCHETYPES.map(a => {
            const selected = prompt === a.prompt;
            return (
              <Pressable
                key={a.id}
                onPress={() => setPrompt(selected ? '' : a.prompt)}
                style={[
                  styles.card,
                  {
                    backgroundColor: selected ? c.thread : c.paperRaised,
                    borderColor: selected ? c.thread : c.rule,
                  },
                ]}>
                <Text style={styles.cardEmoji}>{a.emoji}</Text>
                <Text style={[styles.cardLabel, { color: selected ? c.paper : c.ink }]}>
                  {a.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Error */}
      {error ? (
        <Text style={[styles.error, { color: '#ef4444' }]}>{error}</Text>
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
                이야기 시작하기
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
    fontFamily: FONTS.serifSemibold,
    fontSize: SIZES['3xl'],
    lineHeight: 40,
    letterSpacing: -0.5,
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
    marginBottom: 32,
  },
  input: {
    fontFamily: FONTS.sans,
    fontSize: SIZES.md,
    lineHeight: 24,
    minHeight: 100,
  },
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '48%',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  cardEmoji: {
    fontSize: 22,
  },
  cardLabel: {
    fontFamily: FONTS.sansSemibold,
    fontSize: SIZES.sm,
    lineHeight: 18,
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
  error: {
    fontFamily: FONTS.sans,
    fontSize: SIZES.sm,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
});
