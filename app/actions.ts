'use server';

import { createProblem } from '@/lib/db';
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
  redirect('/?saved=1');
}
