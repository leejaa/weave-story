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
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(), // 'apple' | 'google'
  providerSub: text('provider_sub').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  refreshTokenHash: text('refresh_token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Each story is created by a user via setup questions — no shared global stories.
export const stories = pgTable('stories', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  // Setup answers from the 5 questions, stored as { mood, setting, protagonist, premise, length }
  setupAnswers: jsonb('setup_answers').notNull().default('{}'),
  // AI-generated fields (null until generation completes)
  title: text('title'),
  genre: text('genre'),
  mood: text('mood'),
  coverImageUrl: text('cover_image_url'),
  estimatedChapters: integer('estimated_chapters').notNull().default(10),
  // 'generating' → AI is working | 'ready' → first chapter done | 'completed' → story finished
  status: text('status').notNull().default('generating'),
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
  situation: text('situation'), // narrative setup paragraph before the choice question
  question: text('question'),   // the choice question posed to the reader
  summary: text('summary'),     // AI-generated 200-char summary, stored async after 'ready'
  status: text('status').notNull().default('ready'), // 'generating' | 'ready' | 'failed'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
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
  threads: many(threads),
}));

export const threadsRelations = relations(threads, ({ one, many }) => ({
  user: one(users, { fields: [threads.userId], references: [users.id] }),
  story: one(stories, { fields: [threads.storyId], references: [stories.id] }),
  chapters: many(chapters),
  interventions: many(interventions),
}));

export const chaptersRelations = relations(chapters, ({ one }) => ({
  thread: one(threads, { fields: [chapters.threadId], references: [threads.id] }),
}));

export const interventionsRelations = relations(interventions, ({ one }) => ({
  thread: one(threads, { fields: [interventions.threadId], references: [threads.id] }),
}));
