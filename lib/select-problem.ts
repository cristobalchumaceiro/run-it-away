export type SelectableProblem = {
  id: string;
  status: 'open' | 'solved';
  pinned: boolean;
  createdAt: Date;
};

export type SessionTouch = {
  problemId: string;
  startedAt: Date;
};

export type ProblemSelection<T> = {
  problem: T;
  reason: 'pinned' | 'neglected';
  lastTouchedAt: Date;
};

export function selectProblemForRun<T extends SelectableProblem>(
  problems: T[],
  sessions: SessionTouch[]
): ProblemSelection<T> | null {
  const openProblems = problems.filter((problem) => problem.status === 'open');
  if (openProblems.length === 0) return null;

  const pinnedProblems = openProblems.filter((problem) => problem.pinned);
  const candidates = pinnedProblems.length > 0 ? pinnedProblems : openProblems;
  const reason = pinnedProblems.length > 0 ? 'pinned' : 'neglected';

  const lastTouchedAt = (problem: T) => {
    const problemSessions = sessions.filter((session) => session.problemId === problem.id);
    return problemSessions.reduce(
      (latest, session) => (session.startedAt > latest ? session.startedAt : latest),
      problem.createdAt
    );
  };

  let selected = candidates[0];
  let selectedLastTouchedAt = lastTouchedAt(selected);

  for (const candidate of candidates.slice(1)) {
    const candidateLastTouchedAt = lastTouchedAt(candidate);
    const touchedAtComparison = candidateLastTouchedAt.getTime() - selectedLastTouchedAt.getTime();
    const createdAtComparison = candidate.createdAt.getTime() - selected.createdAt.getTime();

    if (
      touchedAtComparison < 0 ||
      (touchedAtComparison === 0 &&
        (createdAtComparison < 0 || (createdAtComparison === 0 && candidate.id < selected.id)))
    ) {
      selected = candidate;
      selectedLastTouchedAt = candidateLastTouchedAt;
    }
  }

  return { problem: selected, reason, lastTouchedAt: selectedLastTouchedAt };
}
