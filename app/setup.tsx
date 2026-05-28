import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StoryPromptScreen } from '@/components/setup/story-prompt-screen';
import { PaywallModal } from '@/components/ui/paywall-modal';
import { useStoryPrompt } from '@/hooks/use-story-prompt';

export default function SetupScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('weave');
  const {
    prompt,
    setPrompt,
    canSubmit,
    isPending,
    error,
    rawError,
    submit,
    back,
    showPaywall,
    closePaywall,
    onPaywallSuccess,
  } = useStoryPrompt();

  return (
    <>
      <StoryPromptScreen
        insets={insets}
        copy={{
          headline: t('headline'),
          subtext: t('subtext'),
          placeholder: t('placeholder'),
          hint: t('hint'),
          startBtn: t('startBtn'),
          loadingTitle: t('loadingTitle'),
          loadingSubtitle: t('loadingSubtitle'),
        }}
        prompt={prompt}
        onPromptChange={setPrompt}
        canSubmit={canSubmit}
        isPending={isPending}
        error={error}
        rawError={rawError}
        onSubmit={submit}
        onBack={back}
      />
      <PaywallModal visible={showPaywall} onClose={closePaywall} onSuccess={onPaywallSuccess} />
    </>
  );
}
