import { relations } from 'drizzle-orm';
import { boolean, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const problemStatus = pgEnum('problem_status', ['open', 'solved']);
export const sessionTrigger = pgEnum('session_trigger', ['manual', 'tracker']);

export const problems = pgTable('problems', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  rawContext: text('raw_context'),
  status: problemStatus('status').notNull().default('open'),
  pinned: boolean('pinned').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  problemId: uuid('problem_id')
    .notNull()
    .references(() => problems.id, { onDelete: 'cascade' }),
  trigger: sessionTrigger('trigger').notNull().default('manual'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  transcript: jsonb('transcript')
});

export const problemsRelations = relations(problems, ({ many }) => ({
  sessions: many(sessions)
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  problem: one(problems, {
    fields: [sessions.problemId],
    references: [problems.id]
  })
}));

export type ProblemRow = typeof problems.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
