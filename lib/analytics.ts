// Product analytics via Firebase Analytics (GA4). All calls are best-effort:
// analytics must never break a user flow, so every call is wrapped and swallows
// errors. Event/param names follow GA4 limits (snake_case, name <=40 chars,
// string values <=100 chars). Reserved GA4 names (login, purchase, screen_view,
// select_content) are reused where they fit.
import {
  getAnalytics,
  logEvent,
  setUserId,
  setUserProperty,
  setAnalyticsCollectionEnabled,
  logScreenView,
} from '@react-native-firebase/analytics';

import type { SupportedLocale } from '@/lib/i18n';

function client() {
  return getAnalytics();
}

/** Enable collection explicitly (the plist ships with analytics off by default). */
export async function initAnalytics(): Promise<void> {
  try {
    await setAnalyticsCollectionEnabled(client(), true);
  } catch {
    // ignore — analytics is non-critical
  }
}

async function track(name: string, params?: Record<string, string | number | boolean | undefined>): Promise<void> {
  try {
    const clean = params
      ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined))
      : undefined;
    await logEvent(client(), name, clean as Record<string, string | number | boolean> | undefined);
  } catch {
    // ignore
  }
}

/** Tie subsequent events to a user so retention/cohorts work. Pass null on sign-out. */
export async function identifyUser(userId: string | null): Promise<void> {
  try {
    await setUserId(client(), userId);
  } catch {
    // ignore
  }
}

export async function setUserLocale(locale: SupportedLocale): Promise<void> {
  try {
    await setUserProperty(client(), 'app_locale', locale);
  } catch {
    // ignore
  }
}

export async function trackScreen(screenName: string): Promise<void> {
  try {
    await logScreenView(client(), { screen_name: screenName, screen_class: screenName });
  } catch {
    // ignore
  }
}

// ── Funnel events ─────────────────────────────────────────────────────────────

/** Auth. `method` is 'apple' | 'google'. Reuses the reserved GA4 `login` event. */
export const trackLogin = (method: string) => track('login', { method });

/** Activation — a reader started a new story. */
export const trackStoryCreated = (args: { genre?: string; length?: string; language?: string }) =>
  track('story_created', {
    genre: args.genre,
    length: args.length,
    language: args.language,
  });

/** Engagement — a chapter was opened/read. */
export const trackChapterViewed = (args: { chapter: number; isFirst: boolean }) =>
  track('chapter_viewed', { chapter: args.chapter, is_first: args.isFirst });

/** Engagement — reader advanced the story. `kind` is 'choice' | 'free_input'. */
export const trackChoiceMade = (kind: 'choice' | 'free_input') => track('choice_made', { kind });

/** Monetization — paywall shown. `source` = where it was triggered from. */
export const trackPaywallViewed = (source: string) => track('paywall_viewed', { source });

/** Monetization — completed purchase. Reuses the reserved GA4 `purchase` event. */
export const trackPurchase = (args: { productId: string; value?: number; currency?: string }) =>
  track('purchase', {
    item_id: args.productId,
    value: args.value,
    currency: args.currency,
  });
