import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookShelf } from '@/components/home/book-shelf';

export default function CreateScreen() {
  const { t } = useTranslation('home');

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.inner}>
        <BookShelf headline={t('hero.headline')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f5f0e8',
  },
  inner: {
    flex: 1,
  },
});
