import { createSession, selectProblemForRun } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getStartedAt(value: unknown): Date {
  if (isObject(value) && typeof value.startedAt === 'string') {
    const parsed = new Date(value.startedAt);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

export async function POST(request: Request) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const selection = await selectProblemForRun();
  if (!selection) {
    return NextResponse.json({ prompted: false, reason: 'no-open-problems' });
  }

  const session = await createSession({
    problemId: selection.problem.id,
    trigger: 'tracker',
    startedAt: getStartedAt(body)
  });

  return NextResponse.json({
    prompted: true,
    problem: { id: selection.problem.id, title: selection.problem.title },
    reason: selection.reason,
    sessionId: session.id
  });
}
