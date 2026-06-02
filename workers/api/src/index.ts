import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRouter } from './routes/auth';
import { meRouter } from './routes/me';
import { storiesRouter } from './routes/stories';
import { threadsRouter } from './routes/threads';
import { sampleCardsRouter } from './routes/sample-cards';
import { purchasesRouter } from './routes/purchases';
import { reportsRouter } from './routes/reports';
import { privacyPage, termsPage, normalizeLang } from './routes/legal';
import { handleStoryGenerationQueue } from './lib/queue/story-generation-consumer';
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

app.get('/api/health', (c) => c.json({ ok: true }));

// Public legal pages (linked from the app and App Store Connect). Language from
// ?lang=, falling back to Accept-Language, then Korean.
const pickLang = (c: { req: { query: (k: string) => string | undefined; header: (k: string) => string | undefined } }) =>
  normalizeLang(c.req.query('lang') ?? c.req.header('accept-language'));
app.get('/privacy', (c) => c.html(privacyPage(pickLang(c))));
app.get('/terms', (c) => c.html(termsPage(pickLang(c))));

export default {
  fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx);
  },
  queue(batch: MessageBatch<StoryGenerationJob>, env: WorkerEnv) {
    return handleStoryGenerationQueue(batch, env);
  },
};
