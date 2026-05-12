import { ScrollView, View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/icon';
import { usePalette } from '@/hooks/use-palette';
import { useLocale } from '@/hooks/use-locale';
import { useAuth } from '@/lib/auth/client/context';
import { FONTS, SIZES } from '@/constants/colors';

const STAT_KEYS = [
  { value: '24', key: 'threads' },
  { value: '9', key: 'finished' },
  { value: '1.2M', key: 'wordsRead' },
] as const;

const SETTING_KEYS = [
  'readingPreferences',
  'notifications',
  'aiDisclosure',
  'subscription',
  'helpFeedback',
  'language',
] as const;

export default function YouScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('you');
  const { locale, setLocale, supportedLocales, localeLabels } = useLocale();
  const { signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(t('signOut'), t('signOutConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('signOut'), style: 'destructive', onPress: signOut },
    ]);
  };

  const handleLanguageTap = () => {
    Alert.alert(
      t('settings.language'),
      undefined,
      [
        ...supportedLocales.map(loc => ({
          text: `${localeLabels[loc]}${locale === loc ? ' ✓' : ''}`,
          onPress: () => setLocale(loc),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ],
    );
  };

  return (
    <ScrollView
      style={{ backgroundColor: c.paper }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 130 }]}
      showsVerticalScrollIndicator={false}>

      <View style={styles.profile}>
        <View style={[styles.avatar, { backgroundColor: c.ink }]}>
          <Text style={[styles.avatarLetter, { color: c.paper }]}>H</Text>
        </View>
        <View>
          <Text style={[styles.name, { color: c.ink }]}>Hana Lee</Text>
          <Text style={[styles.since, { color: c.inkFaint }]}>
            {t('sinceLine', { date: 'MAY 2026' })}
          </Text>
        </View>
      </View>

      <View style={styles.stats}>
        {STAT_KEYS.map(s => (
          <View key={s.key} style={[styles.statCard, { backgroundColor: c.paperSunk }]}>
            <Text style={[styles.statValue, { color: c.ink }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: c.inkSoft }]}>{t(`stats.${s.key}`)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.settingsList}>
        {SETTING_KEYS.map((key, i) => (
          <Pressable
            key={key}
            onPress={key === 'language' ? handleLanguageTap : undefined}
            style={({ pressed }) => [
              styles.settingsRow,
              { borderBottomColor: c.rule },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.settingsLabel, { color: c.ink }]}>{t(`settings.${key}`)}</Text>
            {key === 'language' ? (
              <Text style={[styles.settingsValue, { color: c.inkSoft }]}>
                {localeLabels[locale]}
              </Text>
            ) : null}
            <Icon name="chevron-right" size={16} color={c.inkFaint} />
          </Pressable>
        ))}
        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [styles.settingsRow, styles.lastRow, pressed && styles.pressed]}>
          <Text style={[styles.settingsLabel, { color: c.ember }]}>{t('signOut')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontFamily: FONTS.serifSemibold, fontSize: 26 },
  name: { fontFamily: FONTS.serifSemibold, fontSize: SIZES['2xl'] },
  since: { fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.4, marginTop: 2 },
  stats: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', gap: 4 },
  statValue: { fontFamily: FONTS.serifSemibold, fontSize: SIZES['2xl'] },
  statLabel: { fontFamily: FONTS.sans, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' },
  settingsList: {},
  settingsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  lastRow: { borderBottomWidth: 0 },
  pressed: { opacity: 0.6 },
  settingsLabel: { flex: 1, fontFamily: FONTS.sans, fontSize: SIZES.md },
  settingsValue: { fontFamily: FONTS.sans, fontSize: SIZES.sm, marginRight: 4 },
});
