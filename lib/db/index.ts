import { neon } from '@neondatabase/serverless';
import { desc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import { seedProblems, seedSessions } from './seed-data';
import { problems, sessions, type ProblemRow, type SessionRow } from './schema';

export type NewProblem = {
  title: string;
  rawContext?: string | null;
};

export type ProblemRepository = {
  listProblems: () => Promise<ProblemRow[]>;
  getProblem: (id: string) => Promise<ProblemRow | undefined>;
  createProblem: (problem: NewProblem) => Promise<ProblemRow>;
  listSessionsForProblem: (problemId: string) => Promise<SessionRow[]>;
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

  return {
    async listProblems() {
      return memoryProblems
        .slice()
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map(cloneProblem);
    },
    async getProblem(id) {
      const problem = memoryProblems.find((item) => item.id === id);
      return problem ? cloneProblem(problem) : undefined;
    },
    async createProblem({ title, rawContext }) {
      const now = new Date();
      const problem: ProblemRow = {
        id: crypto.randomUUID(),
        title,
        rawContext: rawContext || null,
        status: 'open',
        createdAt: now,
        updatedAt: now
      };
      memoryProblems.unshift(problem);
      return cloneProblem(problem);
    },
    async listSessionsForProblem(problemId) {
      return memorySessions
        .filter((session) => session.problemId === problemId)
        .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
        .map(cloneSession);
    }
  };
}

function createNeonRepository(databaseUrl: string): ProblemRepository {
  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema: { problems, sessions } });

  return {
    async listProblems() {
      return db.select().from(problems).orderBy(desc(problems.createdAt));
    },
    async getProblem(id) {
      const rows = await db.select().from(problems).where(eq(problems.id, id)).limit(1);
      return rows[0];
    },
    async createProblem({ title, rawContext }) {
      const rows = await db
        .insert(problems)
        .values({ title, rawContext: rawContext || null })
        .returning();
      return rows[0];
    },
    async listSessionsForProblem(problemId) {
      return db
        .select()
        .from(sessions)
        .where(eq(sessions.problemId, problemId))
        .orderBy(desc(sessions.startedAt));
    }
  };
}

const databaseUrl = process.env.DATABASE_URL;
export const repository = databaseUrl
  ? createNeonRepository(databaseUrl)
  : createMemoryRepository();

export const { listProblems, getProblem, createProblem, listSessionsForProblem } = repository;
