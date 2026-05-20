import { Platform } from 'react-native';

export const RC_PUBLIC_KEY = Platform.select({
  ios: 'appl_MuIYplYJKCLlOeksxDjmgMVOIQm',
  android: '', // add after Google Play setup
}) ?? '';

export const ENTITLEMENT_PREMIUM = 'premium';

export const PRODUCT_IDS = {
  premiumMonthly: 'com.leejahun.weavestory.premium_monthly',
  creditsStarter: 'com.leejahun.weavestory.credits_starter_3',
  creditsValue: 'com.leejahun.weavestory.credits_value_10',
} as const;

export const CREDITS_PER_PRODUCT: Record<string, number> = {
  [PRODUCT_IDS.creditsStarter]: 3,
  [PRODUCT_IDS.creditsValue]: 10,
};
