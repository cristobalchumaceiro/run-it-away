'use server';

import { createProblem, createSession, setProblemPinned } from '@/lib/db';
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
