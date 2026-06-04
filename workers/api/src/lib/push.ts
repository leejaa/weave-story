// Sends Expo push notifications when a chapter finishes generating, so a user
// who left the app gets pulled back in. Best-effort: failures never break
// generation. Tokens Expo reports as unregistered are pruned.
import { eq, inArray } from 'drizzle-orm';
import { pushTokens } from './schema';
import type { DB } from './db';
import type { StoryLang } from './ai/story-lang';

type Kind = 'first' | 'next';

const COPY: Record<StoryLang, Record<Kind, { title: string; body: (t: string) => string }>> = {
  en: {
    first: { title: 'Your story is ready ✨', body: (t) => `“${t}” — tap to start reading.` },
    next: { title: 'The next chapter is ready', body: (t) => `“${t}” continues — tap to read on.` },
  },
  ja: {
    first: { title: '物語が完成しました ✨', body: (t) => `「${t}」をタップして読み始めましょう。` },
    next: { title: '次の章が届きました', body: (t) => `「${t}」の続きをどうぞ。` },
  },
  ko: {
    first: { title: '이야기가 준비됐어요 ✨', body: (t) => `「${t}」 — 탭하면 바로 읽을 수 있어요.` },
    next: { title: '다음 챕터가 도착했어요', body: (t) => `「${t}」 이어서 읽어보세요.` },
  },
};

const FALLBACK_TITLE: Record<StoryLang, string> = { en: 'Your story', ja: '物語', ko: '이야기' };

export async function sendChapterReadyPush(params: {
  db: DB;
  userId: string;
  threadId: string;
  storyTitle: string | null;
  language: StoryLang;
  kind: Kind;
}): Promise<void> {
  const { db, userId, threadId, storyTitle, language, kind } = params;

  const rows = await db
    .select({ token: pushTokens.token })
    .from(pushTokens)
    .where(eq(pushTokens.userId, userId));
  if (rows.length === 0) return;

  const copy = COPY[language][kind];
  const title = storyTitle?.trim() || FALLBACK_TITLE[language];
  const messages = rows.map((r) => ({
    to: r.token,
    title: copy.title,
    body: copy.body(title),
    sound: 'default',
    channelId: 'default',
    data: { threadId, kind, url: `/reading/${threadId}` },
  }));

  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });
    const json = (await res.json().catch(() => null)) as
      | { data?: Array<{ status: string; details?: { error?: string } }> }
      | null;

    const dead: string[] = [];
    json?.data?.forEach((ticket, i) => {
      if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
        dead.push(rows[i].token);
      }
    });
    if (dead.length) await db.delete(pushTokens).where(inArray(pushTokens.token, dead));
    console.log(`[push] sent kind=${kind} thread=${threadId} tokens=${rows.length} dead=${dead.length}`);
  } catch (err) {
    console.error('[push] send failed (non-critical)', err);
  }
}
