import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Field } from '@/components/ui/field';
import { usePalette } from '@/hooks/use-palette';
import { FONTS, SIZES } from '@/constants/colors';
import { useWeaveForm } from '@/hooks/use-weave-form';

type MoodKey = 'mystery' | 'romance' | 'folk' | 'cozy' | 'eerie' | 'slowBurn' | 'sharp' | 'tender';
type LengthKey = 'short' | 'medium' | 'long';

const MOOD_KEYS: MoodKey[] = ['mystery', 'romance', 'folk', 'cozy', 'eerie', 'slowBurn', 'sharp', 'tender'];
const LENGTH_KEYS: LengthKey[] = ['short', 'medium', 'long'];

export default function WeaveScreen() {
  const c = usePalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('weave');
  const { t: tc } = useTranslation('common');
  const { seed, setSeed, moods, toggleMood, length, setLength } = useWeaveForm();

  return (
    <ScrollView
      style={{ backgroundColor: c.paper }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 140 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">

      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: c.inkFaint }]}>{t('eyebrow')}</Text>
        <Text style={[styles.title, { color: c.ink }]}>{t('title')}</Text>
        <Text style={[styles.subtitle, { color: c.inkSoft }]}>{t('subtitle')}</Text>
      </View>

      <View style={styles.form}>
        <Field
          label={t('seed.label')}
          placeholder={t('seed.placeholder')}
          value={seed}
          onChangeText={setSeed}
          multiline
        />

        <View>
          <Text style={[styles.fieldLabel, { color: c.inkSoft }]}>{t('mood')}</Text>
          <View style={styles.chips}>
            {MOOD_KEYS.map(key => (
              <Chip key={key} on={moods.has(key)} onPress={() => toggleMood(key)}>
                {tc(`genres.${key}`)}
              </Chip>
            ))}
          </View>
        </View>

        <View>
          <Text style={[styles.fieldLabel, { color: c.inkSoft }]}>{t('length')}</Text>
          <View style={styles.chips}>
            {LENGTH_KEYS.map(key => (
              <Chip key={key} on={length === key} onPress={() => setLength(key)}>
                {tc(`length.${key}`)}
              </Chip>
            ))}
          </View>
        </View>

        <View style={[styles.disclosure, { backgroundColor: c.amberSoft }]}>
          <Text style={[styles.disclosureText, { color: c.inkSoft }]}>{t('disclosure')}</Text>
        </View>

        <Button full onPress={() => router.push('/reading/new')}>
          {t('begin')}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  header: { marginBottom: 24 },
  eyebrow: {
    fontFamily: FONTS.sansSemibold,
    fontSize: SIZES['2xs'],
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: { fontFamily: FONTS.serifSemibold, fontSize: SIZES['3xl'], letterSpacing: -0.4, marginTop: 4 },
  subtitle: { fontFamily: FONTS.serifItalic, fontSize: SIZES.md, marginTop: 8, lineHeight: 22 },
  form: { gap: 16 },
  fieldLabel: { fontFamily: FONTS.sansSemibold, fontSize: SIZES.xs, letterSpacing: 0.6, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  disclosure: { borderRadius: 10, padding: 14 },
  disclosureText: { fontFamily: FONTS.sans, fontSize: SIZES.xs, lineHeight: 18 },
});
