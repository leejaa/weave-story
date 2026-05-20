import { View, Text, Image, Pressable, Alert, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { usePalette } from '@/hooks/use-palette';
import { useLocale } from '@/hooks/use-locale';
import { useAuth } from '@/lib/auth/client/context';
import { useMe } from '@/hooks/use-me';
import { usePurchases } from '@/lib/purchases/context';
import { FONTS, SIZES } from '@/constants/colors';
import type { SupportedLocale } from '@/lib/i18n';

export default function ProfileScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation('you');
  const { locale, setLocale, supportedLocales, localeLabels } = useLocale();
  const { signOut } = useAuth();
  const { data: me } = useMe();
  const { isPremium } = usePurchases();

  const handleSignOut = () => {
    Alert.alert(t('signOut'), t('signOutConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('signOut'),
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: c.paper, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>

      <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
        <Icon name="chevron-left" size={24} color={c.inkSoft} />
      </Pressable>

      {/* Account */}
      <View style={[styles.section, { borderBottomColor: c.rule }]}>
        {me?.avatarUrl ? (
          <Image source={{ uri: me.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: c.ink }]}>
            <Text style={[styles.avatarLetter, { color: c.paper }]}>
              {(me?.name ?? me?.email ?? '?')[0].toUpperCase()}
            </Text>
          </View>
        )}
        {me?.name ? (
          <Text style={[styles.displayName, { color: c.ink }]}>{me.name}</Text>
        ) : null}
        <Text style={[styles.email, { color: c.inkSoft }]} numberOfLines={1}>
          {me?.email ?? me?.id ?? '—'}
        </Text>
      </View>

      {/* Plan */}
      <View style={[styles.section, { borderBottomColor: c.rule }]}>
        <Text style={[styles.label, { color: c.inkFaint }]}>{t('plan')}</Text>
        <View style={styles.planRow}>
          <View style={[styles.planBadge, { backgroundColor: isPremium ? c.thread : c.paperSunk, borderColor: isPremium ? c.thread : c.rule }]}>
            <Text style={[styles.planBadgeText, { color: isPremium ? c.paper : c.inkSoft }]}>
              {isPremium ? 'Premium' : 'Free'}
            </Text>
          </View>
          {isPremium ? (
            <Text style={[styles.planDesc, { color: c.inkSoft }]}>{t('unlimitedStories')}</Text>
          ) : (
            <Text style={[styles.planDesc, { color: c.inkSoft }]}>
              {t('creditsRemaining', { count: me?.credits ?? 0 })}
            </Text>
          )}
        </View>
      </View>

      {/* Language */}
      <View style={[styles.section, { borderBottomColor: c.rule }]}>
        <Text style={[styles.label, { color: c.inkFaint }]}>{t('language')}</Text>
        <View style={styles.chips}>
          {(supportedLocales as readonly SupportedLocale[]).map(loc => {
            const active = locale === loc;
            return (
              <Pressable
                key={loc}
                onPress={() => setLocale(loc)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? c.thread : c.paperSunk,
                    borderColor: active ? c.thread : c.rule,
                  },
                ]}>
                <Text style={[styles.chipText, { color: active ? c.paper : c.inkSoft }]}>
                  {localeLabels[loc]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Sign out */}
      <Pressable onPress={handleSignOut} style={styles.signOutBtn} hitSlop={8}>
        <Text style={[styles.signOutText, { color: c.ember }]}>{t('signOut')}</Text>
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  backBtn: { marginBottom: 28 },
  section: {
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontFamily: FONTS.serifSemibold, fontSize: 22 },
  displayName: { fontFamily: FONTS.sansSemibold, fontSize: SIZES.md },
  email: { fontFamily: FONTS.mono, fontSize: SIZES.sm, letterSpacing: 0.2 },
  label: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  planBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  planBadgeText: { fontFamily: FONTS.sansMedium, fontSize: SIZES.sm },
  planDesc: { fontFamily: FONTS.sans, fontSize: SIZES.sm },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontFamily: FONTS.sansMedium, fontSize: SIZES.sm },
  signOutBtn: { marginTop: 28 },
  signOutText: { fontFamily: FONTS.sans, fontSize: SIZES.md },
});
