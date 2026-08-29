import { notFound } from 'next/navigation';
import { saveNextStep } from '@/app/actions';
import { getProblem, getSession } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ReflectPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const session = await getSession(params.id);
  if (!session) notFound();
  const problem = await getProblem(session.problemId);
  if (!problem) notFound();

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto flex min-h-[80vh] max-w-2xl flex-col justify-center">
        <h1 className="text-4xl font-semibold leading-tight tracking-[-0.04em] text-paper sm:text-6xl">What&apos;s the next step?</h1>
        {searchParams.error === 'empty' ? (
          <p className="mt-5 rounded-xl border border-orange-300/25 bg-orange-300/[0.08] px-4 py-3 text-sm leading-6 text-orange-100">
            Give the next step a few words before saving.
          </p>
        ) : null}
        <form className="mt-8" action={saveNextStep.bind(null, session.id, problem.id)}>
          <textarea
            name="body"
            required
            autoFocus
            rows={6}
            placeholder="I will..."
            className="w-full rounded-2xl border border-white/15 bg-white/[0.045] p-5 text-lg leading-8 text-paper outline-none placeholder:text-white/30 focus:border-lime-300 focus:ring-2 focus:ring-lime-300/30"
          />
          <button
            type="submit"
            className="mt-5 min-h-16 w-full rounded-2xl bg-lime-300 px-6 text-lg font-black text-ink transition hover:bg-lime-200 focus:outline-none focus:ring-4 focus:ring-lime-300/30 active:scale-[0.99]"
          >
            Save
          </button>
        </form>
      </div>
    </main>
  );
}
