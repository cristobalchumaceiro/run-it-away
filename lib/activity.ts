import {
  createActivity,
  createPrompt,
  getProblem,
  latestPendingPrompt,
  selectProblemForRun
} from '@/lib/db';
import type { ActivityRow } from '@/lib/db/schema';

export type ActivityKind = ActivityRow['kind'];

export type ActivityStartResult =
  | { prompted: false; activityId: string; reason: 'race' | 'no-open-problems' }
  | {
      prompted: true;
      activityId: string;
      promptId: string;
      problem: { id: string; title: string };
      reason: 'pinned' | 'neglected';
    };

export async function startActivity(input: {
  kind: ActivityKind;
  startedAt?: Date;
}): Promise<ActivityStartResult> {
  const activity = await createActivity({
    kind: input.kind,
    startedAt: input.startedAt ?? new Date()
  });

  if (input.kind === 'race') {
    return { prompted: false, activityId: activity.id, reason: 'race' };
  }

  const pendingPrompt = await latestPendingPrompt();
  if (pendingPrompt) {
    const problem = await getProblem(pendingPrompt.problemId);
    if (problem) {
      return {
        prompted: true,
        activityId: activity.id,
        promptId: pendingPrompt.id,
        problem: { id: problem.id, title: problem.title },
        reason: problem.pinned ? 'pinned' : 'neglected'
      };
    }
  }

  const selection = await selectProblemForRun();
  if (!selection) {
    return { prompted: false, activityId: activity.id, reason: 'no-open-problems' };
  }

  const prompt = await createPrompt({
    activityId: activity.id,
    problemId: selection.problem.id
  });

  return {
    prompted: true,
    activityId: activity.id,
    promptId: prompt.id,
    problem: { id: selection.problem.id, title: selection.problem.title },
    reason: selection.reason
  };
}
