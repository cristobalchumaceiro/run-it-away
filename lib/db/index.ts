import { neon } from '@neondatabase/serverless';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import { selectProblemForRun as selectProblemForRunPure, type ProblemSelection } from '../select-problem';
import { seedProblems, seedSessions } from './seed-data';
import {
  activities,
  notes,
  problems,
  prompts,
  sessions,
  type ActivityRow,
  type NoteRow,
  type ProblemRow,
  type PromptRow,
  type SessionRow
} from './schema';

export type NewProblem = {
  title: string;
  rawContext?: string | null;
};

export type NewSession = {
  problemId: string;
  trigger: SessionRow['trigger'];
  startedAt?: Date;
};

export type NewActivity = {
  kind: ActivityRow['kind'];
  startedAt: Date;
};

export type NewPrompt = {
  activityId: string;
  problemId: string;
};

export type NewNote = {
  problemId: string;
  sessionId?: string | null;
  kind: NoteRow['kind'];
  body: string;
  uncertain?: boolean;
};

export type ProblemRepository = {
  listProblems: () => Promise<ProblemRow[]>;
  getProblem: (id: string) => Promise<ProblemRow | undefined>;
  createProblem: (problem: NewProblem) => Promise<ProblemRow>;
  listSessions: () => Promise<SessionRow[]>;
  getSession: (id: string) => Promise<SessionRow | undefined>;
  listSessionsForProblem: (problemId: string) => Promise<SessionRow[]>;
  createSession: (session: NewSession) => Promise<SessionRow>;
  setProblemPinned: (problemId: string, pinned: boolean) => Promise<ProblemRow | undefined>;
  selectProblemForRun: (excludeProblemIds?: readonly string[]) => Promise<ProblemSelection<ProblemRow> | null>;
  createActivity: (activity: NewActivity) => Promise<ActivityRow>;
  getActivity: (id: string) => Promise<ActivityRow | undefined>;
  createPrompt: (prompt: NewPrompt) => Promise<PromptRow>;
  getPrompt: (id: string) => Promise<PromptRow | undefined>;
  listPromptsForActivity: (activityId: string) => Promise<PromptRow[]>;
  latestPendingPrompt: () => Promise<PromptRow | undefined>;
  updatePromptState: (id: string, state: PromptRow['state']) => Promise<PromptRow | undefined>;
  createNote: (note: NewNote) => Promise<NoteRow>;
  listNotesForSession: (sessionId: string) => Promise<NoteRow[]>;
  listNotesForProblem: (problemId: string) => Promise<NoteRow[]>;
  endSession: (sessionId: string) => Promise<SessionRow | undefined>;
};

type MemoryState = {
  problems: ProblemRow[];
  sessions: SessionRow[];
  activities: ActivityRow[];
  prompts: PromptRow[];
  notes: NoteRow[];
};

declare global {
  var runItAwayMemoryState: MemoryState | undefined;
}

function cloneProblem(problem: ProblemRow): ProblemRow {
  return { ...problem, createdAt: new Date(problem.createdAt), updatedAt: new Date(problem.updatedAt) };
}

function cloneSession(session: SessionRow): SessionRow {
  return {
    ...session,
    startedAt: new Date(session.startedAt),
    endedAt: session.endedAt ? new Date(session.endedAt) : null
  };
}

function cloneActivity(activity: ActivityRow): ActivityRow {
  return {
    ...activity,
    startedAt: new Date(activity.startedAt),
    createdAt: new Date(activity.createdAt)
  };
}

function clonePrompt(prompt: PromptRow): PromptRow {
  return {
    ...prompt,
    createdAt: new Date(prompt.createdAt),
    respondedAt: prompt.respondedAt ? new Date(prompt.respondedAt) : null
  };
}

function cloneNote(note: NoteRow): NoteRow {
  return {
    ...note,
    createdAt: new Date(note.createdAt)
  };
}

function createMemoryRepository(): ProblemRepository {
  const memoryState =
    globalThis.runItAwayMemoryState ??
    (globalThis.runItAwayMemoryState = {
      problems: seedProblems.map(cloneProblem),
      sessions: seedSessions.map(cloneSession),
      activities: [],
      prompts: [],
      notes: []
    });
  memoryState.notes ??= [];
  const {
    problems: memoryProblems,
    sessions: memorySessions,
    activities: memoryActivities,
    prompts: memoryPrompts,
    notes: memoryNotes
  } = memoryState;

  const listProblems = async () =>
    memoryProblems
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(cloneProblem);
  const getProblem = async (id: string) => {
    const problem = memoryProblems.find((item) => item.id === id);
    return problem ? cloneProblem(problem) : undefined;
  };
  const createProblem = async ({ title, rawContext }: NewProblem) => {
    const now = new Date();
    const problem: ProblemRow = {
      id: crypto.randomUUID(),
      title,
      rawContext: rawContext || null,
      status: 'open',
      pinned: false,
      createdAt: now,
      updatedAt: now
    };
    memoryProblems.unshift(problem);
    return cloneProblem(problem);
  };
  const listSessions = async () =>
    memorySessions
      .slice()
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .map(cloneSession);
  const getSession = async (id: string) => {
    const session = memorySessions.find((item) => item.id === id);
    return session ? cloneSession(session) : undefined;
  };
  const listSessionsForProblem = async (problemId: string) =>
    memorySessions
      .filter((session) => session.problemId === problemId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .map(cloneSession);
  const createSession = async ({ problemId, trigger, startedAt }: NewSession) => {
    const session: SessionRow = {
      id: crypto.randomUUID(),
      problemId,
      trigger,
      startedAt: startedAt ?? new Date(),
      endedAt: null,
      transcript: null
    };
    memorySessions.unshift(session);
    return cloneSession(session);
  };
  const setProblemPinned = async (problemId: string, pinned: boolean) => {
    const problem = memoryProblems.find((item) => item.id === problemId);
    if (!problem) return undefined;
    problem.pinned = pinned;
    problem.updatedAt = new Date();
    return cloneProblem(problem);
  };
  const selectProblemForRun = async (excludeProblemIds: readonly string[] = []) => {
    const [allProblems, allSessions] = await Promise.all([listProblems(), listSessions()]);
    return selectProblemForRunPure(allProblems, allSessions, excludeProblemIds);
  };
  const createActivity = async ({ kind, startedAt }: NewActivity) => {
    const activity: ActivityRow = {
      id: crypto.randomUUID(),
      kind,
      startedAt,
      createdAt: new Date()
    };
    memoryActivities.unshift(activity);
    return cloneActivity(activity);
  };
  const getActivity = async (id: string) => {
    const activity = memoryActivities.find((item) => item.id === id);
    return activity ? cloneActivity(activity) : undefined;
  };
  const createPrompt = async ({ activityId, problemId }: NewPrompt) => {
    const existing = memoryPrompts.find(
      (prompt) => prompt.activityId === activityId && (prompt.state === 'pending' || prompt.state === 'accepted')
    );
    if (existing) return clonePrompt(existing);

    const prompt: PromptRow = {
      id: crypto.randomUUID(),
      activityId,
      problemId,
      state: 'pending',
      createdAt: new Date(),
      respondedAt: null
    };
    memoryPrompts.unshift(prompt);
    return clonePrompt(prompt);
  };
  const getPrompt = async (id: string) => {
    const prompt = memoryPrompts.find((item) => item.id === id);
    return prompt ? clonePrompt(prompt) : undefined;
  };
  const listPromptsForActivity = async (activityId: string) =>
    memoryPrompts
      .filter((prompt) => prompt.activityId === activityId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(clonePrompt);
  const latestPendingPrompt = async () =>
    memoryPrompts
      .filter((prompt) => prompt.state === 'pending')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(clonePrompt)[0];
  const updatePromptState = async (id: string, state: PromptRow['state']) => {
    const prompt = memoryPrompts.find((item) => item.id === id);
    if (!prompt) return undefined;
    prompt.state = state;
    prompt.respondedAt = state === 'pending' ? null : new Date();
    return clonePrompt(prompt);
  };
  const createNote = async ({ problemId, sessionId, kind, body, uncertain }: NewNote) => {
    const note: NoteRow = {
      id: crypto.randomUUID(),
      problemId,
      sessionId: sessionId ?? null,
      kind,
      body,
      uncertain: uncertain ?? false,
      createdAt: new Date()
    };
    memoryNotes.unshift(note);
    return cloneNote(note);
  };
  const listNotesForSession = async (sessionId: string) =>
    memoryNotes
      .filter((note) => note.sessionId === sessionId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(cloneNote);
  const listNotesForProblem = async (problemId: string) =>
    memoryNotes
      .filter((note) => note.problemId === problemId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map(cloneNote);
  const endSession = async (sessionId: string) => {
    const session = memorySessions.find((item) => item.id === sessionId);
    if (!session) return undefined;
    session.endedAt = new Date();
    return cloneSession(session);
  };

  return {
    listProblems,
    getProblem,
    createProblem,
    listSessions,
    getSession,
    listSessionsForProblem,
    createSession,
    setProblemPinned,
    selectProblemForRun,
    createActivity,
    getActivity,
    createPrompt,
    getPrompt,
    listPromptsForActivity,
    latestPendingPrompt,
    updatePromptState,
    createNote,
    listNotesForSession,
    listNotesForProblem,
    endSession
  };
}

function createNeonRepository(databaseUrl: string): ProblemRepository {
  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema: { activities, notes, problems, prompts, sessions } });

  const listProblems = () => db.select().from(problems).orderBy(desc(problems.createdAt));
  const getProblem = async (id: string) => {
    const rows = await db.select().from(problems).where(eq(problems.id, id)).limit(1);
    return rows[0];
  };
  const createProblem = async ({ title, rawContext }: NewProblem) => {
    const rows = await db
      .insert(problems)
      .values({ title, rawContext: rawContext || null })
      .returning();
    return rows[0];
  };
  const listSessions = () => db.select().from(sessions).orderBy(desc(sessions.startedAt));
  const getSession = async (id: string) => {
    const rows = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
    return rows[0];
  };
  const listSessionsForProblem = (problemId: string) =>
    db
      .select()
      .from(sessions)
      .where(eq(sessions.problemId, problemId))
      .orderBy(desc(sessions.startedAt));
  const createSession = async ({ problemId, trigger, startedAt }: NewSession) => {
    const rows = await db
      .insert(sessions)
      .values({ problemId, trigger, startedAt: startedAt ?? new Date(), endedAt: null, transcript: null })
      .returning();
    return rows[0];
  };
  const setProblemPinned = async (problemId: string, pinned: boolean) => {
    const rows = await db
      .update(problems)
      .set({ pinned, updatedAt: new Date() })
      .where(eq(problems.id, problemId))
      .returning();
    return rows[0];
  };
  const selectProblemForRun = async (excludeProblemIds: readonly string[] = []) => {
    const [allProblems, allSessions] = await Promise.all([listProblems(), listSessions()]);
    return selectProblemForRunPure(allProblems, allSessions, excludeProblemIds);
  };
  const createActivity = async ({ kind, startedAt }: NewActivity) => {
    const rows = await db.insert(activities).values({ kind, startedAt }).returning();
    return rows[0];
  };
  const getActivity = async (id: string) => {
    const rows = await db.select().from(activities).where(eq(activities.id, id)).limit(1);
    return rows[0];
  };
  const createPrompt = async ({ activityId, problemId }: NewPrompt) => {
    const existing = await db
      .select()
      .from(prompts)
      .where(and(eq(prompts.activityId, activityId), inArray(prompts.state, ['pending', 'accepted'])))
      .limit(1);
    if (existing[0]) return existing[0];

    const rows = await db.insert(prompts).values({ activityId, problemId }).returning();
    return rows[0];
  };
  const getPrompt = async (id: string) => {
    const rows = await db.select().from(prompts).where(eq(prompts.id, id)).limit(1);
    return rows[0];
  };
  const listPromptsForActivity = (activityId: string) =>
    db.select().from(prompts).where(eq(prompts.activityId, activityId)).orderBy(desc(prompts.createdAt));
  const latestPendingPrompt = async () => {
    const rows = await db
      .select()
      .from(prompts)
      .where(eq(prompts.state, 'pending'))
      .orderBy(desc(prompts.createdAt))
      .limit(1);
    return rows[0];
  };
  const updatePromptState = async (id: string, state: PromptRow['state']) => {
    const rows = await db
      .update(prompts)
      .set({ state, respondedAt: state === 'pending' ? null : new Date() })
      .where(eq(prompts.id, id))
      .returning();
    return rows[0];
  };
  const createNote = async ({ problemId, sessionId, kind, body, uncertain }: NewNote) => {
    const rows = await db
      .insert(notes)
      .values({ problemId, sessionId: sessionId ?? null, kind, body, uncertain: uncertain ?? false })
      .returning();
    return rows[0];
  };
  const listNotesForSession = (sessionId: string) =>
    db.select().from(notes).where(eq(notes.sessionId, sessionId)).orderBy(desc(notes.createdAt));
  const listNotesForProblem = (problemId: string) =>
    db.select().from(notes).where(eq(notes.problemId, problemId)).orderBy(notes.createdAt);
  const endSession = async (sessionId: string) => {
    const rows = await db
      .update(sessions)
      .set({ endedAt: new Date() })
      .where(eq(sessions.id, sessionId))
      .returning();
    return rows[0];
  };

  return {
    listProblems,
    getProblem,
    createProblem,
    listSessions,
    getSession,
    listSessionsForProblem,
    createSession,
    setProblemPinned,
    selectProblemForRun,
    createActivity,
    getActivity,
    createPrompt,
    getPrompt,
    listPromptsForActivity,
    latestPendingPrompt,
    updatePromptState,
    createNote,
    listNotesForSession,
    listNotesForProblem,
    endSession
  };
}

const databaseUrl = process.env.DATABASE_URL;
export const repository = databaseUrl
  ? createNeonRepository(databaseUrl)
  : createMemoryRepository();

export const {
  listProblems,
  getProblem,
  createProblem,
  listSessions,
  getSession,
  listSessionsForProblem,
  createSession,
  setProblemPinned,
  selectProblemForRun,
  createActivity,
  getActivity,
  createPrompt,
  getPrompt,
  listPromptsForActivity,
  latestPendingPrompt,
  updatePromptState,
  createNote,
  listNotesForSession,
  listNotesForProblem,
  endSession
} = repository;
