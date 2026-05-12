import { relations } from 'drizzle-orm';
import { integer, jsonb, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

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

export const stories = pgTable('stories', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').unique().notNull(),
  description: text('description'),
  genre: text('genre').notNull(),
  mood: text('mood').notNull(),
  coverImageUrl: text('cover_image_url'),
  estimatedChapters: integer('estimated_chapters').notNull().default(10),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const threads = pgTable('threads', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  storyId: uuid('story_id').notNull().references(() => stories.id),
  status: text('status').notNull().default('active'), // 'active' | 'finished'
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
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  options: jsonb('options'), // [{ index: 0, text: '...' }, ...]
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
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const storiesRelations = relations(stories, ({ many }) => ({
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
