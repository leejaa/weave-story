import { useWindowDimensions } from 'react-native';

export function useStoryPromptLayout() {
  const { height } = useWindowDimensions();
  const isCompact = height < 760;

  return {
    contentPaddingTop: isCompact ? 6 : 14,
    writingMarginTop: isCompact ? 34 : 58,
    inputMinHeight: isCompact ? 164 : 204,
  };
}
