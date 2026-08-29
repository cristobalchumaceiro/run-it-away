import assert from 'node:assert/strict';
import test from 'node:test';
import { selectProblemForRun, type SelectableProblem, type SessionTouch } from './select-problem';

function problem(
  id: string,
  createdAt: string,
  pinned = false,
  status: SelectableProblem['status'] = 'open'
): SelectableProblem {
  return { id, createdAt: new Date(createdAt), pinned, status };
}

function session(problemId: string, startedAt: string): SessionTouch {
  return { problemId, startedAt: new Date(startedAt) };
}

test('pinned open problem wins over a more-neglected unpinned problem', () => {
  const pinned = problem('pinned', '2025-01-02T00:00:00Z', true);
  const neglected = problem('neglected', '2025-01-01T00:00:00Z');

  const selection = selectProblemForRun([pinned, neglected], []);

  assert.equal(selection?.problem.id, 'pinned');
  assert.equal(selection?.reason, 'pinned');
});

test('pinned solved problem is skipped', () => {
  const solvedPinned = problem('solved-pinned', '2025-01-01T00:00:00Z', true, 'solved');
  const open = problem('open', '2025-01-02T00:00:00Z');

  const selection = selectProblemForRun([solvedPinned, open], []);

  assert.equal(selection?.problem.id, 'open');
  assert.equal(selection?.reason, 'neglected');
});

test('neglect uses the latest session start rather than createdAt', () => {
  const oldWithRecentSession = problem('old', '2020-01-01T00:00:00Z');
  const newerWithoutSession = problem('new', '2025-01-01T00:00:00Z');

  const selection = selectProblemForRun(
    [oldWithRecentSession, newerWithoutSession],
    [session('old', '2025-02-01T00:00:00Z')]
  );

  assert.equal(selection?.problem.id, 'new');
  assert.equal(selection?.lastTouchedAt.toISOString(), '2025-01-01T00:00:00.000Z');
});

test('returns null for empty and all-solved inputs', () => {
  assert.equal(selectProblemForRun([], []), null);
  assert.equal(selectProblemForRun([problem('solved', '2025-01-01T00:00:00Z', false, 'solved')], []), null);
});

test('uses createdAt and then id as deterministic tie-breakers', () => {
  const older = problem('z', '2025-01-01T00:00:00Z');
  const sameDateSmallerId = problem('a', '2025-01-01T00:00:00Z');
  const selection = selectProblemForRun([older, sameDateSmallerId], []);

  assert.equal(selection?.problem.id, 'a');
});

test('does not mutate problems or sessions', () => {
  const problems = [problem('b', '2025-01-02T00:00:00Z'), problem('a', '2025-01-01T00:00:00Z')];
  const sessions = [session('b', '2025-01-03T00:00:00Z')];
  const originalProblems = problems.map((item) => ({ ...item }));
  const originalSessions = sessions.map((item) => ({ ...item }));

  selectProblemForRun(problems, sessions);

  assert.deepEqual(problems, originalProblems);
  assert.deepEqual(sessions, originalSessions);
});
