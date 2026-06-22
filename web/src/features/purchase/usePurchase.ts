import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { IAP } from '@apps-in-toss/web-framework';
import * as Sentry from '@sentry/react';
import { isInTossApp } from '@/lib/auth';
import { grantTossOrder } from './api';

/**
 * 앱인토스 인앱결제(IAP) — 크레딧 충전.
 * - buy(sku): 주문서 → 결제 → 서버 지급(processProductGrant) → 크레딧 갱신.
 * - 마운트 시 중단된 주문(getPendingOrders) 복원: 재지급 후 completeProductGrant.
 * 토스 앱 밖(브라우저)에선 IAP 미지원 → 안내만.
 */
export function usePurchase() {
  const qc = useQueryClient();
  const [buying, setBuying] = useState<string | null>(null);

  const refreshMe = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ['me'] });
  }, [qc]);

  const buy = useCallback((sku: string) => {
    if (!isInTossApp()) {
      window.alert('충전은 토스 앱에서만 할 수 있어요.');
      return;
    }
    setBuying(sku);
    const cleanup = IAP.createOneTimePurchaseOrder({
      options: {
        sku,
        processProductGrant: async ({ orderId }) => {
          try {
            const r = await grantTossOrder(orderId, sku);
            return r.granted;
          } catch (err) {
            Sentry.captureException(err, { tags: { context: 'iap_grant' }, extra: { sku, orderId } });
            return false;
          }
        },
      },
      onEvent: () => {
        setBuying(null);
        refreshMe();
        cleanup();
      },
      onError: (err) => {
        // 주문/결제 단계 실패(예: 미등록 sku, 결제 취소). 실제 사유를 남겨 원인 추적 가능하게.
        Sentry.captureException(err, { tags: { context: 'iap_order' }, extra: { sku } });
        setBuying(null);
        cleanup();
      },
    });
  }, [refreshMe]);

  // 중단된 주문 복원(결제됐지만 지급 실패한 건 재지급).
  useEffect(() => {
    if (!isInTossApp()) return;
    let cancelled = false;
    (async () => {
      try {
        const pending = await IAP.getPendingOrders();
        if (cancelled || !pending?.orders?.length) return;
        let recovered = false;
        for (const o of pending.orders) {
          const r = await grantTossOrder(o.orderId, o.sku);
          if (r.granted) {
            await IAP.completeProductGrant({ params: { orderId: o.orderId } });
            recovered = true;
          }
        }
        if (recovered && !cancelled) refreshMe();
      } catch (err) {
        Sentry.captureException(err, { tags: { context: 'iap_pending_recovery' } });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshMe]);

  return { buy, buying };
}
