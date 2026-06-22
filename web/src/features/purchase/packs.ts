// 크레딧 팩.
// sku = 앱인토스 콘솔의 "상품 ID"(ait....). 토스 IAP는 createOneTimePurchaseOrder의 sku를
// productId와 동일한 값으로 요구한다(공식 문서). 내부 라벨(credits_*)을 넣으면 주문 생성이
// 실패(onError)하므로 반드시 콘솔의 상품 ID를 그대로 쓴다. credits는 서버 TOSS_CREDITS_PER_SKU와 일치.
export type CreditPack = { sku: string; credits: number; label: string };

export const CREDIT_PACKS: CreditPack[] = [
  { sku: 'ait.0000040536.f7b25186.5c1a0276b0.1419199903', credits: 3, label: '스타터 · 3 크레딧' },
  { sku: 'ait.0000040536.e8c978b2.4c19968402.1419376677', credits: 10, label: '밸류 · 10 크레딧' },
];
