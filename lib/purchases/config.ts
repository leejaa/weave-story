export const PRODUCT_IDS = {
  creditsStarter: 'com.leejahun.weavestory.credits_starter_3',
  creditsValue: 'com.leejahun.weavestory.credits_value_10',
} as const;

export const CREDITS_PER_PRODUCT: Record<string, number> = {
  [PRODUCT_IDS.creditsStarter]: 3,
  [PRODUCT_IDS.creditsValue]: 10,
};
