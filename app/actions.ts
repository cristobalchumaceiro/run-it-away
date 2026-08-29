'use server';

import {
  createProblem,
  createPrompt,
  createSession,
  getActivity,
  getPrompt,
  listPromptsForActivity,
  selectProblemForRun,
  setProblemPinned,
  updatePromptState
} from '@/lib/db';
import { startActivity, type ActivityKind } from '@/lib/activity';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function saveBrainDump(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  const rawContext = String(formData.get('rawContext') ?? '').trim();

  if (!title) {
    redirect('/?error=title');
  }

  await createProblem({ title, rawContext });
  revalidatePath('/');
  redirect(`/?saved=${Date.now()}`);
}

export async function startThinkingSession(problemId: string, _formData: FormData) {
  await createSession({ problemId, trigger: 'manual' });
  revalidatePath('/');
  revalidatePath(`/problems/${problemId}`);
  redirect(`/problems/${problemId}`);
}

export async function toggleProblemPinned(problemId: string, pinned: boolean, _formData: FormData) {
  await setProblemPinned(problemId, pinned);
  revalidatePath('/');
  revalidatePath(`/problems/${problemId}`);
}

export async function acceptPrompt(promptId: string, _formData: FormData) {
  const prompt = await getPrompt(promptId);
  if (!prompt || prompt.state !== 'pending') return;

  const activity = await getActivity(prompt.activityId);
  if (!activity) return;

  await updatePromptState(prompt.id, 'accepted');
  await createSession({
    problemId: prompt.problemId,
    trigger: 'tracker',
    startedAt: activity.startedAt
  });
  revalidatePath('/');
  revalidatePath(`/problems/${prompt.problemId}`);
  redirect(`/problems/${prompt.problemId}`);
}

export async function declinePrompt(promptId: string, _formData: FormData) {
  const prompt = await getPrompt(promptId);
  if (!prompt || prompt.state !== 'pending') return;

  await updatePromptState(prompt.id, 'declined');
  revalidatePath('/');
}

export async function swapPrompt(promptId: string, _formData: FormData) {
  const prompt = await getPrompt(promptId);
  if (!prompt || prompt.state !== 'pending') return;

  await updatePromptState(prompt.id, 'swapped');
  const prompts = await listPromptsForActivity(prompt.activityId);
  const selection = await selectProblemForRun(prompts.map((item) => item.problemId));
  if (selection) {
    await createPrompt({ activityId: prompt.activityId, problemId: selection.problem.id });
  }
  revalidatePath('/');
}

export async function startDemoActivity(kind: ActivityKind, _formData: FormData) {
  const result = await startActivity({ kind });
  if (result.prompted) {
    redirect(`/tracker?outcome=prompted&problem=${encodeURIComponent(result.problem.title)}`);
  }
  redirect(`/tracker?outcome=${result.reason}`);
}
