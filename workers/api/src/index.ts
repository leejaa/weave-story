import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRouter } from './routes/auth';
import { meRouter } from './routes/me';
import { storiesRouter } from './routes/stories';
import { threadsRouter } from './routes/threads';
import { sampleCardsRouter } from './routes/sample-cards';
import { purchasesRouter } from './routes/purchases';
import { reportsRouter } from './routes/reports';
import { pushRouter } from './routes/push';
import { privacyPage, termsPage, supportPage, mandarinPrivacyPage, normalizeLang } from './routes/legal';
import { handleStoryGenerationQueue } from './lib/queue/story-generation-consumer';
import { logError } from './lib/observability/logger';
import { alertServerError } from './lib/observability/alert';
import type { StoryGenerationJob } from './lib/queue/story-generation-jobs';
import type { AppEnv, WorkerEnv } from './types';

const app = new Hono<AppEnv>();

app.use('*', cors());

app.route('/api/auth', authRouter);
app.route('/api/me', meRouter);
app.route('/api/stories', storiesRouter);
app.route('/api/threads', threadsRouter);
app.route('/api/sample-cards', sampleCardsRouter);
app.route('/api/purchases', purchasesRouter);
app.route('/api/reports', reportsRouter);
app.route('/api/push', pushRouter);

app.get('/api/health', (c) => c.json({ ok: true }));

// Public legal pages (linked from the app and App Store Connect). Language from
// ?lang=, falling back to Accept-Language, then Korean.
const pickLang = (c: { req: { query: (k: string) => string | undefined; header: (k: string) => string | undefined } }) =>
  normalizeLang(c.req.query('lang') ?? c.req.header('accept-language'));
app.get('/privacy', (c) => c.html(privacyPage(pickLang(c))));
app.get('/terms', (c) => c.html(termsPage(pickLang(c))));
app.get('/support', (c) => c.html(supportPage(pickLang(c))));
app.get('/mandarin/privacy', (c) => c.html(mandarinPrivacyPage()));

// 미처리 예외 전역 핸들러: Cloudflare 에 풀 컨텍스트(스택 포함) 로그 + 텔레그램 이정표 알림.
// cf-ray 를 상관관계 키로 사용 → 알림의 ray 로 Cloudflare 로그를 바로 검색.
// 라우트가 정상 반환한 4xx(예: insufficient_credits)는 throw 가 아니므로 여기 오지 않는다.
app.onError((err, c) => {
  const requestId = c.req.header('cf-ray') ?? crypto.randomUUID();
  const errorName = err instanceof Error ? err.name : 'Error';

  logError(err, {
    event: 'request_error',
    requestId,
    method: c.req.method,
    path: c.req.path,
    userId: c.get('userId'),
  });
  c.executionCtx.waitUntil(alertServerError(c.env, {
    source: 'request',
    requestId,
    method: c.req.method,
    path: c.req.path,
    status: 500,
    errorName,
  }));

  return c.json({ error: 'Internal Server Error', requestId }, 500);
});

export default {
  fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx);
  },
  queue(batch: MessageBatch<StoryGenerationJob>, env: WorkerEnv) {
    return handleStoryGenerationQueue(batch, env);
  },
};
