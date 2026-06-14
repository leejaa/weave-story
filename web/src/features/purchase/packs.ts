// 크레딧 팩 — sku는 앱인토스 콘솔에 등록한 소비성 상품 ID와, credits는 서버
// TOSS_CREDITS_PER_SKU와 반드시 일치해야 한다.
export type CreditPack = { sku: string; credits: number; label: string };

export const CREDIT_PACKS: CreditPack[] = [
  { sku: 'credits_starter_3', credits: 3, label: '스타터 · 3 크레딧' },
  { sku: 'credits_value_10', credits: 10, label: '밸류 · 10 크레딧' },
];
