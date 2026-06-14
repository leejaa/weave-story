import type { WorkerEnv } from '../../types';

// 앱인토스 인앱결제(IAP) 서버 지급. 소비성 크레딧 팩.
// 콘솔에 등록하는 SKU와 키가 일치해야 한다(미일치 시 Unknown SKU로 거부).
export const TOSS_CREDITS_PER_SKU: Record<string, number> = {
  credits_starter_3: 3,
  credits_value_10: 10,
};

const TOSS_API = 'https://apps-in-toss-api.toss.im';

export type TossOrderVerification = { verified: boolean; raw: unknown };

/**
 * 토스 IAP 주문 검증(getIapOrderStatus). 정확한 응답 스키마는 콘솔 API 탐색기 전용이라
 * 마크다운 문서에 없음 → 첫 실주문 응답을 **로깅**해 스키마를 확정한다.
 * 결제완료/지급가능으로 판단되면 verified=true. 불명확하면 false.
 *
 * 정확한 경로/필드 확정 후 PATHS·isPaid를 고정할 것.
 */
export async function verifyTossOrder(env: WorkerEnv, orderId: string): Promise<TossOrderVerification> {
  if (!env.TOSS_MTLS) return { verified: false, raw: 'no_mtls' };

  // 후보 경로(파트너 API 관례 기반). 첫 성공 응답으로 실제 경로/스키마 확정.
  const candidates = [
    `${TOSS_API}/api-partner/v1/apps-in-toss/iap/order-status?orderId=${encodeURIComponent(orderId)}`,
    `${TOSS_API}/api-partner/v1/apps-in-toss/iap/orders/${encodeURIComponent(orderId)}`,
  ];

  for (const url of candidates) {
    try {
      const res = await env.TOSS_MTLS.fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
      const text = await res.text();
      if (!res.ok) {
        console.warn(`[toss-iap] verify ${res.status} ${url} :: ${text.slice(0, 300)}`);
        continue;
      }
      let raw: unknown;
      try { raw = JSON.parse(text); } catch { raw = text; }
      // 실주문 시 정확한 스키마 파악용 전체 로깅(민감정보 없음).
      console.log(`[toss-iap] verify OK ${url} :: ${text.slice(0, 800)}`);
      const verified = looksPaid(raw);
      return { verified, raw };
    } catch (err) {
      console.warn(`[toss-iap] verify error ${url}`, err);
    }
  }
  return { verified: false, raw: 'no_match' };
}

// 결제완료/지급가능 상태 추정(스키마 확정 전 방어적). 흔한 필드명을 폭넓게 인식.
function looksPaid(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false;
  const o = raw as Record<string, unknown>;
  const status = String(o.status ?? o.orderStatus ?? o.paymentStatus ?? o.state ?? '').toUpperCase();
  const PAID = ['PAID', 'COMPLETED', 'DONE', 'SUCCESS', 'APPROVED', 'GRANTED', 'PURCHASED'];
  return PAID.some((s) => status.includes(s));
}
