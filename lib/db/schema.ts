import { relations, sql } from 'drizzle-orm';
import { boolean, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const problemStatus = pgEnum('problem_status', ['open', 'solved']);
export const sessionTrigger = pgEnum('session_trigger', ['manual', 'tracker']);
export const activityKind = pgEnum('activity_kind', ['run', 'walk', 'cycle', 'race']);
export const promptState = pgEnum('prompt_state', ['pending', 'accepted', 'declined', 'swapped']);

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

export const activities = pgTable('activities', {
  id: uuid('id').defaultRandom().primaryKey(),
  kind: activityKind('kind').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const prompts = pgTable(
  'prompts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    activityId: uuid('activity_id')
      .notNull()
      .references(() => activities.id, { onDelete: 'cascade' }),
    problemId: uuid('problem_id')
      .notNull()
      .references(() => problems.id, { onDelete: 'cascade' }),
    state: promptState('state').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    respondedAt: timestamp('responded_at', { withTimezone: true })
  },
  (table) => ({
    livePromptPerActivity: uniqueIndex('prompts_live_activity_idx')
      .on(table.activityId)
      .where(sql`${table.state} in ('pending', 'accepted')`)
  })
);

export const problemsRelations = relations(problems, ({ many }) => ({
  sessions: many(sessions),
  prompts: many(prompts)
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  problem: one(problems, {
    fields: [sessions.problemId],
    references: [problems.id]
  })
}));

export const activitiesRelations = relations(activities, ({ many }) => ({
  prompts: many(prompts)
}));

export const promptsRelations = relations(prompts, ({ one }) => ({
  activity: one(activities, {
    fields: [prompts.activityId],
    references: [activities.id]
  }),
  problem: one(problems, {
    fields: [prompts.problemId],
    references: [problems.id]
  })
}));

export type ProblemRow = typeof problems.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
export type ActivityRow = typeof activities.$inferSelect;
export type PromptRow = typeof prompts.$inferSelect;
