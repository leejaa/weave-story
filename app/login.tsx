import * as AppleAuthentication from 'expo-apple-authentication';
import { Redirect } from 'expo-router';
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const { state, signInWithApple, signInWithGoogle } = useAuth();
  const insets = useSafeAreaInsets();

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
});
