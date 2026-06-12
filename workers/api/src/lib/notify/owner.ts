import type { WorkerEnv } from '../../types';

/**
 * 운영자(owner)에게 텔레그램으로 중요한 액션 알림을 보낸다. Best-effort:
 * TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID 가 없으면 no-op, 실패해도 throw 하지 않는다.
 * 요청 흐름을 막지 않도록 호출부에서 c.executionCtx.waitUntil(notifyOwner(...)) 로 감싸 쓴다.
 */
export async function notifyOwner(env: WorkerEnv, text: string): Promise<void> {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    if (!res.ok) {
      console.error(`[notify] telegram ${res.status} ${await res.text().catch(() => '')}`);
    }
  } catch (err) {
    console.error('[notify] telegram failed', err);
  }
}
