import { api } from '@/lib/api';

export type GrantResult = { granted: boolean; credits: number; alreadyGranted?: boolean };

/** 앱인토스 IAP 주문 지급 요청(서버가 orderId 멱등 검증·적립). */
export function grantTossOrder(orderId: string, sku: string) {
  return api.post<GrantResult>('/api/purchases/toss', { orderId, sku });
}
