import Link from 'next/link';
import { listProblems } from '@/lib/db';
import { ProblemCard } from '@/components/problem-card';
import { QuickCapture } from '@/components/quick-capture';

export const dynamic = 'force-dynamic';

export default async function Home({
  searchParams
}: {
  searchParams: { saved?: string; error?: string };
}) {
  const problems = await listProblems();
  const saved = typeof searchParams.saved === 'string' && searchParams.saved.length > 0;

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 flex items-center justify-between gap-4">
          <Link href="/" className="group inline-flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-lime-300">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-orange-300 text-xl text-ink transition group-hover:rotate-[-8deg]">↗</span>
            <span>
              <span className="block text-sm font-black uppercase tracking-[0.18em] text-paper">Run It Away</span>
              <span className="block text-xs text-white/45">The brain dump inbox</span>
            </span>
          </Link>
          <span className="hidden text-right text-xs uppercase tracking-[0.16em] text-white/35 sm:block">
            Capture first.<br />Solve later.
          </span>
        </header>

        <section className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-lime-300">Before the run</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-paper sm:text-6xl">
            Put the problem down.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/55 sm:text-lg">
            Capture the knot while it is loud. We&apos;ll keep it here while you step away.
          </p>
        </section>

        {saved ? (
          <p className="mb-5 rounded-xl border border-lime-300/25 bg-lime-300/10 px-4 py-3 text-sm text-lime-200">
            Saved. The problem is out of your head and in your inbox.
          </p>
        ) : null}
        <QuickCapture error={searchParams.error} savedToken={searchParams.saved} />

        <section className="mt-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/35">Your open loops</p>
              <h2 className="mt-2 text-2xl font-semibold text-paper">Problems to step away from</h2>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-white/45">{problems.length}</span>
          </div>
          <div className="space-y-3">
            {problems.length ? (
              problems.map((problem) => <ProblemCard key={problem.id} problem={problem} />)
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 px-5 py-12 text-center text-white/45">
                Your first problem goes here.
              </div>
            )}
          </div>
        </section>

        <footer className="mt-14 border-t border-white/10 pt-5 text-xs leading-5 text-white/35">
          Iteration 1: capture the problem first. The live session is coming next.
        </footer>
      </div>
    </main>
  );
}
