import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChoicePage } from '@/components/reading/choice-page';
import { GeneratingPage } from '@/components/reading/generating-page';
import { PaywallModal } from '@/components/ui/paywall-modal';
import { Icon } from '@/components/ui/icon';
import { usePalette } from '@/hooks/use-palette';
import { useReadingChoice } from '@/hooks/use-reading-choice';
import { trackChoiceMade } from '@/lib/analytics';
import { ApiError, toUserMessage } from '@/lib/api/errors';
import { FONTS, SIZES } from '@/constants/colors';

type Props = {
  threadId: string;
  chapterNumber?: string | string[];
  onClose: () => void;
  onComplete: () => void;
};

export function ReadingChoiceScreen({ threadId, chapterNumber, onClose, onComplete }: Props) {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('reading');
  const {
    data,
    chapter,
    options,
    isLoading,
    choosing,
    choose,
    isInsufficientCredits,
    clearChooseError,
  } = useReadingChoice(threadId, chapterNumber);

  const handleChoose = async (
    selectedChapterNumber: number,
    selection: { choiceIndex: number } | { customInput: string },
  ) => {
    void trackChoiceMade('customInput' in selection ? 'free_input' : 'choice');
    try {
      await choose(selectedChapterNumber, selection);
      onComplete();
    } catch (err) {
      // 402(크레딧 부족)는 PaywallModal이 처리하므로 알림을 띄우지 않는다.
      // 429(레이트 리밋)·5xx·네트워크 등은 토스트성 알림으로 안내(화면 유지, 재시도 가능).
      if (err instanceof ApiError && err.status === 402) return;
      Alert.alert(t('choice.failedTitle'), toUserMessage(err));
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: c.paper }]}>
        <GeneratingPage />
      </View>
    );
  }

  if (!data || !chapter || options.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: c.paper, paddingTop: insets.top + 14 }]}>
        <Pressable onPress={onClose} style={[styles.closeButton, { backgroundColor: c.paperRaised, borderColor: c.rule }]}>
          <Icon name="chevron-left" size={17} color={c.inkSoft} />
        </Pressable>
        <Text style={[styles.emptyText, { color: c.inkSoft }]}>
          {t('notFound')}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.paper }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <PaywallModal
        visible={isInsufficientCredits}
        onClose={clearChooseError}
        onSuccess={clearChooseError}
      />

      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: c.rule }]}>
        <Pressable onPress={onClose} style={[styles.closeButton, { backgroundColor: c.paperRaised, borderColor: c.rule }]}>
          <Icon name="chevron-left" size={17} color={c.inkSoft} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: c.ink }]} numberOfLines={1}>
            {data.title ?? ''}
          </Text>
          <Text style={[styles.subtitle, { color: c.inkFaint }]}>
            {t('choice.entryKicker')}
          </Text>
        </View>
      </View>

      <ChoicePage
        options={options}
        situation={chapter.situation}
        question={chapter.question}
        chapterNumber={chapter.chapterNumber}
        onChoose={handleChoose}
        choosing={choosing}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    minHeight: 72,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontFamily: FONTS.serifSemibold,
    fontSize: SIZES.sm,
  },
  subtitle: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  empty: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyText: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontFamily: FONTS.serifItalic,
    fontSize: SIZES.lg,
  },
});
