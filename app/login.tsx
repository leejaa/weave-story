import * as AppleAuthentication from 'expo-apple-authentication';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { FONTS, SIZES } from '@/constants/colors';
import { useAuth } from '@/lib/auth/client/context';
import { privacyUrl, termsUrl } from '@/lib/legal';

const BG = '#0D0B10';
const TEXT_PRIMARY = '#EDE8F0';
const TEXT_SECONDARY = 'rgba(237,232,240,0.55)';
const TEXT_FAINT = 'rgba(237,232,240,0.3)';
const ACCENT = '#c8b8ce';

function LoginBackground() {
  const player = useVideoPlayer(require('@/assets/videos/login-bg.mp4'), (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
      <View style={styles.overlay} />
    </>
  );
}

export default function LoginScreen() {
  const { state, sessionExpired, signInWithApple, signInWithGoogle, signInWithDemo } = useAuth();
  const { t } = useTranslation('common');
  const insets = useSafeAreaInsets();
  const [reviewerMode, setReviewerMode] = useState(false);
  const [code, setCode] = useState('');
  const [reviewerError, setReviewerError] = useState<string | null>(null);

  const submitReviewerCode = async () => {
    setReviewerError(null);
    try {
      await signInWithDemo(code.trim());
    } catch {
      setReviewerError('Invalid code');
    }
  };

  if (state === 'loading') {
    return (
      <View style={[styles.center, { backgroundColor: BG }]}>
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  }

  if (state === 'authenticated') {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: BG,
          paddingTop: insets.top + 64,
          paddingBottom: insets.bottom + 40,
        },
      ]}>

      <LoginBackground />

      <View style={styles.brand}>
        <View style={[styles.diamond, { backgroundColor: ACCENT }]} />
        <Text style={[styles.wordmark, { color: TEXT_FAINT }]}>WEAVE STORY</Text>
      </View>

      <View style={styles.headline}>
        <Text style={[styles.title, { color: TEXT_PRIMARY }]}>Weave Story</Text>
        <Text style={[styles.subtitle, { color: TEXT_SECONDARY }]}>
          Your stories, woven together.
        </Text>
      </View>

      <View style={styles.spacer} />

      {sessionExpired && (
        <View style={styles.expiredBanner}>
          <Ionicons name="time-outline" size={15} color={ACCENT} />
          <Text style={styles.expiredText}>{t('auth.sessionExpiredBanner')}</Text>
        </View>
      )}

      <View style={styles.actions}>
        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={10}
            style={styles.authButton}
            onPress={signInWithApple}
          />
        )}
        <Pressable
          onPress={signInWithGoogle}
          style={styles.googleButton}>
          <View style={styles.googleInner}>
            <Ionicons name="logo-google" size={16} color={TEXT_SECONDARY} />
            <Text style={[styles.googleLabel, { color: TEXT_PRIMARY }]}>Continue with Google</Text>
          </View>
        </Pressable>

        <Text style={[styles.legal, { color: TEXT_FAINT }]}>
          By continuing, you agree to our{' '}
          <Text style={[styles.legalLink, { color: TEXT_SECONDARY }]} onPress={() => Linking.openURL(termsUrl())}>
            Terms of Service
          </Text>
          {' '}and{' '}
          <Text style={[styles.legalLink, { color: TEXT_SECONDARY }]} onPress={() => Linking.openURL(privacyUrl())}>
            Privacy Policy
          </Text>
          .
        </Text>

        {reviewerMode ? (
          <View style={styles.reviewerBox}>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="Reviewer access code"
              placeholderTextColor={TEXT_FAINT}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.reviewerInput}
              onSubmitEditing={submitReviewerCode}
              returnKeyType="go"
            />
            <Pressable onPress={submitReviewerCode} style={styles.reviewerSubmit}>
              <Text style={[styles.googleLabel, { color: TEXT_PRIMARY }]}>Enter</Text>
            </Pressable>
            {reviewerError ? (
              <Text style={[styles.reviewerError]}>{reviewerError}</Text>
            ) : null}
          </View>
        ) : (
          <Text
            style={[styles.reviewerLink, { color: TEXT_FAINT }]}
            onPress={() => setReviewerMode(true)}>
            Reviewer access
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  brand: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 64,
  },
  diamond: {
    width: 10,
    height: 10,
    transform: [{ rotate: '45deg' }],
  },
  wordmark: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 4,
  },
  headline: {
    alignItems: 'center',
    gap: 12,
  },
  expiredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(200,184,206,0.12)',
    borderColor: 'rgba(200,184,206,0.28)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  expiredText: {
    flex: 1,
    fontFamily: FONTS.sans,
    fontSize: SIZES.sm,
    color: TEXT_PRIMARY,
  },
  title: {
    fontFamily: FONTS.serifSemibold,
    fontSize: SIZES['3xl'],
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontFamily: FONTS.serifItalic,
    fontSize: SIZES.md,
    textAlign: 'center',
    lineHeight: SIZES.md * 1.8,
  },
  spacer: {
    flex: 1,
  },
  actions: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
  },
  authButton: {
    height: 52,
    width: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,6,12,0.55)',
  },
  googleButton: {
    height: 52,
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(237,232,240,0.25)',
    backgroundColor: 'rgba(237,232,240,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  googleLabel: {
    fontFamily: FONTS.sansMedium,
    fontSize: SIZES.md,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  legal: {
    fontFamily: FONTS.sans,
    fontSize: SIZES['2xs'],
    textAlign: 'center',
    lineHeight: SIZES['2xs'] * 1.7,
    marginTop: 4,
    paddingHorizontal: 16,
  },
  legalLink: {
    fontFamily: FONTS.sansMedium,
    textDecorationLine: 'underline',
  },
  reviewerLink: {
    fontFamily: FONTS.sans,
    fontSize: SIZES['2xs'],
    textAlign: 'center',
    marginTop: 8,
    textDecorationLine: 'underline',
  },
  reviewerBox: {
    width: '100%',
    gap: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  reviewerInput: {
    width: '100%',
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(237,232,240,0.25)',
    backgroundColor: 'rgba(237,232,240,0.06)',
    paddingHorizontal: 16,
    color: TEXT_PRIMARY,
    fontFamily: FONTS.sans,
    fontSize: SIZES.md,
  },
  reviewerSubmit: {
    height: 48,
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(237,232,240,0.25)',
    backgroundColor: 'rgba(237,232,240,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerError: {
    fontFamily: FONTS.sans,
    fontSize: SIZES['2xs'],
    color: '#d97768',
  },
});
