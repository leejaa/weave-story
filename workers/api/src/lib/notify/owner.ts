import type { WorkerEnv } from '../../types';

/** 현재 시각을 KST(Asia/Seoul) 사람이 읽기 좋은 형식으로. Workers는 전체 ICU 지원. */
export function kstNow(): string {
  return new Date().toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

/**
 * 운영자(owner)에게 텔레그램으로 알림을 보낸다. Best-effort:
 * TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID 가 없으면 no-op, 실패해도 throw 하지 않는다.
 * 요청 흐름을 막지 않도록 호출부에서 c.executionCtx.waitUntil(notifyOwner(...)) 로 감싸 쓴다.
 * 모든 메시지 끝에 KST 시각 푸터를 자동으로 붙인다.
 */
export async function notifyOwner(env: WorkerEnv, text: string): Promise<void> {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const body = `${text}\n🕒 ${kstNow()} KST`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: body, disable_web_page_preview: true }),
    });
    if (!res.ok) {
      console.error(`[notify] telegram ${res.status} ${await res.text().catch(() => '')}`);
    }
  } catch (err) {
    console.error('[notify] telegram failed', err);
  }
}
