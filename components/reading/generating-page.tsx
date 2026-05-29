import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePalette } from '@/hooks/use-palette';
import { StoryLoader } from '@/components/ui/story-loader';

export function GeneratingPage() {
  const c = usePalette();
  const { t } = useTranslation('reading');

  return (
    <View style={[styles.page, { backgroundColor: c.paper }]}>
      <StoryLoader
        title={t('generating.title')}
        subtitle={t('generating.body')}
        estimate={t('generating.estimate')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
});
