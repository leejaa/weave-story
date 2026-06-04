import { relations } from 'drizzle-orm';
import { boolean, integer, jsonb, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

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
  credits: integer('credits').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const purchaseGrants = pgTable('purchase_grants', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull(),
  rcPurchaseDateMs: text('rc_purchase_date_ms').notNull(),
  creditsGranted: integer('credits_granted').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(), // 'apple' | 'google'
  providerSub: text('provider_sub').notNull(),
  // Apple refresh token, captured at sign-in so we can revoke it on account deletion
  // (Apple Guideline 5.1.1(v)). Nullable: only set for Apple sign-ins when configured.
  appleRefreshToken: text('apple_refresh_token'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  refreshTokenHash: text('refresh_token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

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
  // Language the story is generated in (en | ja | ko). Drives the AI writing prompts.
  language: text('language').notNull().default('en'),
  status: text('status').notNull().default('generating'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

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
});

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
});

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
});

// User reports of objectionable AI-generated content (Apple Guideline 1.2 / UGC).
export const contentReports = pgTable('content_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  reporterUserId: uuid('reporter_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  chapterId: uuid('chapter_id').notNull().references(() => chapters.id, { onDelete: 'cascade' }),
  reason: text('reason').notNull(), // 'sexual' | 'violence' | 'hate' | 'illegal' | 'other'
  detail: text('detail'),
  status: text('status').notNull().default('pending'), // 'pending' | 'reviewed' | 'actioned'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

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
