import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePalette } from '@/hooks/use-palette';
import { StoryLoader } from '@/components/ui/story-loader';
import { registerForPushNotifications } from '@/lib/notifications';

export function GeneratingPage() {
  const c = usePalette();
  const { t } = useTranslation('reading');

  // Generation takes a minute or two — this is the natural moment to ask for
  // notification permission so we can ping the user when their chapter is ready.
  useEffect(() => {
    registerForPushNotifications({ prompt: true });
  }, []);

  return (
    <View style={[styles.page, { backgroundColor: c.paper }]}>
      <StoryLoader
        title={t('generating.title')}
        subtitle={t('generating.body')}
        notify={t('generating.notify')}
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
