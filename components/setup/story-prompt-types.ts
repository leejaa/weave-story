import type { EdgeInsets } from 'react-native-safe-area-context';

export type StoryPromptCopy = {
  headline: string;
  subtext: string;
  placeholder: string;
  hint: string;
  startBtn: string;
  preparingBtn: string;
  loadingTitle: string;
  loadingSubtitle: string;
};

export type StoryPromptScreenProps = {
  insets: EdgeInsets;
  copy: StoryPromptCopy;
  prompt: string;
  onPromptChange: (value: string) => void;
  canSubmit: boolean;
  isPending: boolean;
  error: string | null;
  rawError: unknown;
  onSubmit: () => void;
  onBack: () => void;
};
