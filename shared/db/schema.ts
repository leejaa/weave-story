import { relations } from 'drizzle-orm';
import { boolean, index, integer, jsonb, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const sampleCards = pgTable('sample_cards', {
  id: uuid('id').defaultRandom().primaryKey(),
  genre: text('genre').notNull().unique(),
  genreLabel: text('genre_label').notNull(),
  title: text('title').notNull(),
  color: text('color').notNull(),
  imageUrl: text('image_url'),
  prompt: text('prompt').notNull(),
  displayOrder: integer('display_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 샘플카드 탭 시 랜덤 선택되는 프롬프트 풀. genre별·언어별 다행(多行). 클라 하드코딩/로케일
// 대신 DB가 단일 소스 — SQL로 개별 프롬프트를 언제든 추가/수정/비활성화 가능.
// lang은 StoryLang 캐논값('ko'|'en'|'ja'|'zh-Hant'). API가 ?lang으로 필터링.
export const samplePrompts = pgTable('sample_prompts', {
  id: uuid('id').defaultRandom().primaryKey(),
  genre: text('genre').notNull(), // sample_cards.genre 와 매칭
  lang: text('lang').notNull(),
  // 샘플 책 제목 — body(프롬프트)와 한 쌍. 카드 렌더 시 {title, body} 쌍을 랜덤 선택해
  // 제목으로 노출하고 그 body를 생성 프롬프트로 쓴다. nullable(구 데이터 호환: 없으면 카드 기본 제목).
  title: text('title'),
  body: text('body').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  genreLangIdx: index('sample_prompts_genre_lang_idx').on(table.genre, table.lang),
}));

// 플롯 구조 템플릿 라이브러리(Phase B). 스토리 생성 시 장르에 맞는 템플릿을 랜덤 픽해서
// 전체 아웃라인(기능 비트 시트)의 "골격"으로 쓴다. DB가 단일 소스 — 배포 없이 SQL로 튜닝.
// beats/endingShapes는 구조 골격(내용 아님, 언어 중립)이라 lang 구분 없음.
export const plotStructures = pgTable('plot_structures', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(), // 예: '회귀 복수 아크', 'save-the-cat', '후더닛'
  description: text('description').notNull(),
  applicableGenres: jsonb('applicable_genres').notNull().default('["ANY"]'), // string[] (장르 키 또는 'ANY')
  applicableTones: jsonb('applicable_tones').notNull().default('[]'), // string[] (선택)
  beats: jsonb('beats').notNull().default('[]'), // 기능 비트 골격: [{ function, purpose, pacing }]
  endingShapes: jsonb('ending_shapes').notNull().default('[]'), // 결말 아키타입 2~3개
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  activeIdx: index('plot_structures_active_idx').on(table.isActive),
}));

export const testItems = pgTable('test_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email'),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  credits: integer('credits').notNull().default(10),
  // 마지막 일일 보상 수령일(KST 'YYYY-MM-DD'). 오늘과 다르면 수령 가능.
  lastDailyClaimDate: text('last_daily_claim_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 강제/권장 업데이트 게이트 설정. 플랫폼별 한 행. 재배포 없이 SQL로 즉시 변경 가능.
export const appConfig = pgTable('app_config', {
  platform: text('platform').primaryKey(), // 'ios' | 'android'
  minSupported: text('min_supported').notNull(), // 이 버전 미만이면 강제 업데이트
  latest: text('latest').notNull(), // 최신 버전(권장 업데이트 기준)
  storeUrl: text('store_url').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const purchaseGrants = pgTable('purchase_grants', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull(),
  // 멱등 키 — Apple transactionId 또는 Android purchaseToken. 환불 매칭에도 사용.
  rcPurchaseDateMs: text('rc_purchase_date_ms').notNull(),
  creditsGranted: integer('credits_granted').notNull(),
  // 'active' | 'refunded' — 환불/취소 시 refunded로 전환하고 크레딧을 회수한다.
  status: text('status').notNull().default('active'),
  refundedAt: timestamp('refunded_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_purchase_grants_user_product').on(t.userId, t.productId),
  // 환불 웹훅/폴링이 grantKey로 빠르게 찾도록.
  index('idx_purchase_grants_grant_key').on(t.rcPurchaseDateMs),
]);

export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(), // 'apple' | 'google'
  providerSub: text('provider_sub').notNull(),
  // Apple refresh token, captured at sign-in so we can revoke it on account deletion
  // (Apple Guideline 5.1.1(v)). Nullable: only set for Apple sign-ins when configured.
  appleRefreshToken: text('apple_refresh_token'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_accounts_provider_sub').on(t.provider, t.providerSub),
  index('idx_accounts_user_id').on(t.userId),
]);

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  refreshTokenHash: text('refresh_token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_sessions_refresh_token_hash').on(t.refreshTokenHash),
  index('idx_sessions_expires_at').on(t.expiresAt),
]);

// Expo push tokens, one row per device. Used to notify a user when a chapter
// finishes generating while they're away from the app.
export const pushTokens = pgTable('push_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  platform: text('platform'), // 'ios' | 'android'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_push_tokens_user_id').on(t.userId),
]);

// Each story is created by a user via setup questions, no shared global stories.
export const stories = pgTable('stories', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  setupAnswers: jsonb('setup_answers').notNull().default('{}'),
  title: text('title'),
  genre: text('genre'),
  mood: text('mood'),
  coverImageUrl: text('cover_image_url'),
  estimatedChapters: integer('estimated_chapters').notNull().default(10),
  // Language the story is generated in (en | ja | ko | zh-Hant). Drives the AI writing prompts.
  language: text('language').notNull().default('en'),
  status: text('status').notNull().default('generating'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_stories_user_id').on(t.userId),
]);

export const storyBibles = pgTable('story_bibles', {
  storyId: uuid('story_id').primaryKey().references(() => stories.id, { onDelete: 'cascade' }),
  logline: text('logline').notNull(),
  genre: text('genre').notNull(),
  tone: text('tone').notNull(),
  protagonist: text('protagonist').notNull(),
  centralConflict: text('central_conflict').notNull(),
  readerPromise: text('reader_promise').notNull(),
  openingThreat: text('opening_threat').notNull(),
  openThreads: jsonb('open_threads').notNull().default('[]'),
  forbiddenPatterns: jsonb('forbidden_patterns').notNull().default('[]'),
  desire: text('desire'),
  wound: text('wound'),
  // 불변 캐논: 원본 프롬프트의 핵심 전제(사망/환생 등 메커니즘·장르)를 재해석 없이 고정. 1챕터 1회 기록, 이후 갱신 안 함. 매 챕터 가드레일.
  canon: text('canon'),
  // 스토리 청사진(Phase A): 생성 시 1회 opus-4.7로 작성하는 전역 구성도 —
  // 장르 고정 + 척추(spine) + fraction 기반 마이크로-아크(떡밥 plant→payoff 스케줄).
  // 매 화 프롬프트가 참조해 떡밥 회수를 강제하고 장르 이탈을 막는다. nullable(하위호환: 옛 스토리는 폴백).
  blueprint: jsonb('blueprint'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const threads = pgTable('threads', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  storyId: uuid('story_id').notNull().references(() => stories.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('active'), // 'active' | 'completed'
  currentChapter: integer('current_chapter').notNull().default(1),
  progress: numeric('progress', { precision: 4, scale: 3 }).notNull().default('0'),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  lastReadAt: timestamp('last_read_at', { withTimezone: true }).defaultNow().notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  // (deprecated) 롤링 진행 메모. story_state로 교체됨. 전환기 호환 위해 컬럼만 유지.
  recap: text('recap'),
  // 구조적 진행 상태(JSONB): drive(주인공 능동 목표) + 열린 떡밥 + 인물 상태 + 직전 사건/선택 결과 + 위치/시점.
  // 챕터마다 Haiku로 갱신. 손실 압축 recap을 대체하는 정석 메모리.
  storyState: jsonb('story_state'),
}, (t) => [
  index('idx_threads_user_id').on(t.userId),
  index('idx_threads_story_id').on(t.storyId),
]);

export const chapters = pgTable('chapters', {
  id: uuid('id').defaultRandom().primaryKey(),
  threadId: uuid('thread_id').notNull().references(() => threads.id, { onDelete: 'cascade' }),
  chapterNumber: integer('chapter_number').notNull(),
  title: text('title'),
  content: text('content'),
  imageUrl: text('image_url'),
  options: jsonb('options'), // [{ index: 0, text: '...' }, ...]
  situation: text('situation'),
  question: text('question'),
  summary: text('summary'),
  status: text('status').notNull().default('ready'), // 'generating' | 'ready' | 'failed'
  moderationStatus: text('moderation_status').notNull().default('ok'), // 'ok' | 'reported' | 'hidden'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_chapters_thread_chapter').on(t.threadId, t.chapterNumber),
]);

export const generationRuns = pgTable('generation_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  storyId: uuid('story_id').references(() => stories.id, { onDelete: 'cascade' }),
  threadId: uuid('thread_id').references(() => threads.id, { onDelete: 'cascade' }),
  chapterId: uuid('chapter_id').references(() => chapters.id, { onDelete: 'cascade' }),
  chapterNumber: integer('chapter_number'),
  stage: text('stage').notNull(),
  promptVersion: text('prompt_version').notNull(),
  model: text('model').notNull(),
  status: text('status').notNull().default('started'),
  inputSnapshot: jsonb('input_snapshot').notNull().default('{}'),
  outputSnapshot: jsonb('output_snapshot'),
  qualityScores: jsonb('quality_scores'),
  error: jsonb('error'),
  elapsedMs: integer('elapsed_ms'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const interventions = pgTable('interventions', {
  id: uuid('id').defaultRandom().primaryKey(),
  threadId: uuid('thread_id').notNull().references(() => threads.id, { onDelete: 'cascade' }),
  chapterNumber: integer('chapter_number').notNull(),
  type: text('type').notNull(), // 'choice' | 'free_input'
  choiceIndex: integer('choice_index'),
  freeText: text('free_text'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_interventions_thread_chapter').on(t.threadId, t.chapterNumber),
]);

// User reports of objectionable AI-generated content (Apple Guideline 1.2 / UGC).
export const contentReports = pgTable('content_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  reporterUserId: uuid('reporter_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  chapterId: uuid('chapter_id').notNull().references(() => chapters.id, { onDelete: 'cascade' }),
  reason: text('reason').notNull(), // 'sexual' | 'violence' | 'hate' | 'illegal' | 'other'
  detail: text('detail'),
  status: text('status').notNull().default('pending'), // 'pending' | 'reviewed' | 'actioned'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_content_reports_chapter_id').on(t.chapterId),
]);

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  stories: many(stories),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const storiesRelations = relations(stories, ({ one, many }) => ({
  user: one(users, { fields: [stories.userId], references: [users.id] }),
  bible: one(storyBibles, { fields: [stories.id], references: [storyBibles.storyId] }),
  threads: many(threads),
  generationRuns: many(generationRuns),
}));

export const storyBiblesRelations = relations(storyBibles, ({ one }) => ({
  story: one(stories, { fields: [storyBibles.storyId], references: [stories.id] }),
}));

export const threadsRelations = relations(threads, ({ one, many }) => ({
  user: one(users, { fields: [threads.userId], references: [users.id] }),
  story: one(stories, { fields: [threads.storyId], references: [stories.id] }),
  chapters: many(chapters),
  interventions: many(interventions),
  generationRuns: many(generationRuns),
}));

export const chaptersRelations = relations(chapters, ({ one }) => ({
  thread: one(threads, { fields: [chapters.threadId], references: [threads.id] }),
}));

export const interventionsRelations = relations(interventions, ({ one }) => ({
  thread: one(threads, { fields: [interventions.threadId], references: [threads.id] }),
}));

export const generationRunsRelations = relations(generationRuns, ({ one }) => ({
  story: one(stories, { fields: [generationRuns.storyId], references: [stories.id] }),
  thread: one(threads, { fields: [generationRuns.threadId], references: [threads.id] }),
  chapter: one(chapters, { fields: [generationRuns.chapterId], references: [chapters.id] }),
}));
