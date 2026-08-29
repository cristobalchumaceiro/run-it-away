import { neon } from '@neondatabase/serverless';
import { desc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import { selectProblemForRun as selectProblemForRunPure, type ProblemSelection } from '../select-problem';
import { seedProblems, seedSessions } from './seed-data';
import { problems, sessions, type ProblemRow, type SessionRow } from './schema';

export type NewProblem = {
  title: string;
  rawContext?: string | null;
};

export type NewSession = {
  problemId: string;
  trigger: SessionRow['trigger'];
  startedAt?: Date;
};

export type ProblemRepository = {
  listProblems: () => Promise<ProblemRow[]>;
  getProblem: (id: string) => Promise<ProblemRow | undefined>;
  createProblem: (problem: NewProblem) => Promise<ProblemRow>;
  listSessions: () => Promise<SessionRow[]>;
  listSessionsForProblem: (problemId: string) => Promise<SessionRow[]>;
  createSession: (session: NewSession) => Promise<SessionRow>;
  setProblemPinned: (problemId: string, pinned: boolean) => Promise<ProblemRow | undefined>;
  selectProblemForRun: () => Promise<ProblemSelection<ProblemRow> | null>;
};

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

function createMemoryRepository(): ProblemRepository {
  const memoryProblems = seedProblems.map(cloneProblem);
  const memorySessions = seedSessions.map(cloneSession);

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
  const selectProblemForRun = async () => {
    const [allProblems, allSessions] = await Promise.all([listProblems(), listSessions()]);
    return selectProblemForRunPure(allProblems, allSessions);
  };

  return {
    listProblems,
    getProblem,
    createProblem,
    listSessions,
    listSessionsForProblem,
    createSession,
    setProblemPinned,
    selectProblemForRun
  };
}

function createNeonRepository(databaseUrl: string): ProblemRepository {
  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema: { problems, sessions } });

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
  const selectProblemForRun = async () => {
    const [allProblems, allSessions] = await Promise.all([listProblems(), listSessions()]);
    return selectProblemForRunPure(allProblems, allSessions);
  };

  return {
    listProblems,
    getProblem,
    createProblem,
    listSessions,
    listSessionsForProblem,
    createSession,
    setProblemPinned,
    selectProblemForRun
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
  listSessionsForProblem,
  createSession,
  setProblemPinned,
  selectProblemForRun
} = repository;
