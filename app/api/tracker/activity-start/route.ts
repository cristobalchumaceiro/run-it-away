import { startActivity, type ActivityKind } from '@/lib/activity';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isActivityKind(value: unknown): value is ActivityKind {
  return value === 'run' || value === 'walk' || value === 'cycle' || value === 'race';
}

function getStartedAt(value: unknown): Date | undefined {
  if (!isObject(value) || typeof value.startedAt !== 'string') return undefined;
  const parsed = new Date(value.startedAt);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export async function POST(request: Request) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const kindValue = isObject(body) ? body.kind : undefined;
  const kind = kindValue === undefined ? 'run' : kindValue;
  if (!isActivityKind(kind)) {
    return NextResponse.json({ error: 'Unrecognized activity kind' }, { status: 400 });
  }

  const result = await startActivity({ kind, startedAt: getStartedAt(body) });
  return NextResponse.json(result);
}
