import { useCallback, useState } from 'react';
import { View, Text, Image, Pressable, Alert, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/ui/icon';
import { PaywallModal } from '@/components/ui/paywall-modal';
import { usePalette } from '@/hooks/use-palette';
import { useLocale } from '@/hooks/use-locale';
import { useAuth } from '@/lib/auth/client/context';
import { useMe } from '@/hooks/use-me';
import { FONTS, SIZES } from '@/constants/colors';
import type { SupportedLocale } from '@/lib/i18n';

export default function ProfileScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useTranslation('you');
  const { locale, setLocale, supportedLocales, localeLabels } = useLocale();
  const { signOut, deleteAccount } = useAuth();
  const { data: me } = useMe();
  const [showPaywall, setShowPaywall] = useState(false);

  const credits = me?.credits ?? 0;

  const handlePaywallSuccess = useCallback(() => {
    setShowPaywall(false);
    queryClient.invalidateQueries({ queryKey: ['me'] });
  }, [queryClient]);

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

  const handleDeleteAccount = () => {
    Alert.alert(t('deleteAccount'), t('deleteAccountConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('deleteAccount'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAccount();
            router.replace('/login');
          } catch {
            Alert.alert(t('deleteAccountErrorTitle'), t('deleteAccountError'));
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: c.paper, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>

      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={t('common:a11y.back', 'Back')}
        style={styles.backBtn}>
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

      {/* Credits */}
      <View style={[styles.section, { borderBottomColor: c.rule }]}>
        <Text style={[styles.label, { color: c.inkFaint }]}>Credits</Text>
        <View style={styles.creditBlock}>
          <Text style={[styles.creditNumber, { color: credits === 0 ? c.ember : c.thread }]}>
            {credits}
          </Text>
          <View style={styles.creditFooter}>
            <Text style={[styles.creditDesc, { color: c.inkSoft }]}>
              {t('creditsRemaining', { count: credits })}
            </Text>
            <Pressable
              onPress={() => setShowPaywall(true)}
              style={[styles.rechargeBtn, { borderColor: c.thread }]}
              hitSlop={8}>
              <Icon name="plus" size={12} color={c.thread} />
              <Text style={[styles.rechargeText, { color: c.thread }]}>{t('recharge')}</Text>
            </Pressable>
          </View>
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

      {/* Delete account */}
      <Pressable onPress={handleDeleteAccount} style={styles.deleteBtn} hitSlop={8}>
        <Text style={[styles.deleteText, { color: c.inkFaint }]}>{t('deleteAccount')}</Text>
      </Pressable>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSuccess={handlePaywallSuccess}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  backBtn: { marginBottom: 28 },
  section: {
    paddingVertical: 22,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontFamily: FONTS.serifSemibold, fontSize: 26 },
  displayName: { fontFamily: FONTS.serifSemibold, fontSize: SIZES.lg },
  email: { fontFamily: FONTS.mono, fontSize: SIZES.sm, letterSpacing: 0.2 },
  label: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  creditBlock: {
    gap: 6,
  },
  creditNumber: {
    fontFamily: FONTS.serifSemibold,
    fontSize: 64,
    lineHeight: 68,
  },
  creditFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  creditDesc: { fontFamily: FONTS.mono, fontSize: SIZES.sm },
  rechargeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  rechargeText: { fontFamily: FONTS.sansSemibold, fontSize: SIZES.sm },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontFamily: FONTS.sansMedium, fontSize: SIZES.sm },
  signOutBtn: { marginTop: 32 },
  signOutText: { fontFamily: FONTS.sans, fontSize: SIZES.md },
  deleteBtn: { marginTop: 20 },
  deleteText: { fontFamily: FONTS.sans, fontSize: SIZES.sm, textDecorationLine: 'underline' },
});
