'use server';

import {
  createProblem,
  createPrompt,
  createNote,
  createSession,
  endSession,
  getActivity,
  getPrompt,
  getSession,
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
  const session = await createSession({ problemId, trigger: 'manual' });
  revalidatePath('/');
  revalidatePath(`/problems/${problemId}`);
  redirect(`/session/${session.id}`);
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
  const session = await createSession({
    problemId: prompt.problemId,
    trigger: 'tracker',
    startedAt: activity.startedAt
  });
  revalidatePath('/');
  revalidatePath(`/problems/${prompt.problemId}`);
  redirect(`/session/${session.id}`);
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

export async function endThinkingSession(sessionId: string, _formData: FormData) {
  const session = await getSession(sessionId);
  if (!session) return;
  await endSession(sessionId);
  revalidatePath(`/session/${sessionId}`);
  revalidatePath(`/session/${sessionId}/reflect`);
  redirect(`/session/${sessionId}/reflect`);
}

export async function saveRunnerUtterance(sessionId: string, problemId: string, body: string) {
  if (!body.trim()) return;
  const session = await getSession(sessionId);
  if (!session || session.problemId !== problemId) return;
  await createNote({ problemId, sessionId, kind: 'voice', body, uncertain: true });
  revalidatePath(`/session/${sessionId}`);
  revalidatePath(`/session/${sessionId}/reflect`);
  revalidatePath(`/problems/${problemId}`);
}

async function saveNote(
  sessionId: string,
  problemId: string,
  kind: 'voice' | 'text' | 'next_step',
  formData: FormData,
  uncertain: boolean
) {
  const body = String(formData.get('body') ?? '');
  if (!body.trim()) redirect(`/session/${sessionId}${kind === 'next_step' ? '/reflect?error=empty' : '?error=empty'}`);
  const session = await getSession(sessionId);
  if (!session || session.problemId !== problemId) return;
  await createNote({ problemId, sessionId, kind, body, uncertain });
  revalidatePath(`/session/${sessionId}`);
  revalidatePath(`/session/${sessionId}/reflect`);
  revalidatePath(`/problems/${problemId}`);
  if (kind === 'next_step') redirect(`/problems/${problemId}`);
  redirect(`/session/${sessionId}`);
}

export async function saveNextStep(sessionId: string, problemId: string, formData: FormData) {
  const session = await getSession(sessionId);
  if (!session || session.problemId !== problemId || !session.endedAt) return;
  await saveNote(sessionId, problemId, 'next_step', formData, false);
}
