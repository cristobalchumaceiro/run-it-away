import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProblem, listSessionsForProblem } from '@/lib/db';

export const dynamic = 'force-dynamic';

function formatTimestamp(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

export default async function ProblemHub({ params }: { params: { id: string } }) {
  const problem = await getProblem(params.id);
  if (!problem) notFound();

  const sessions = await listSessionsForProblem(problem.id);
  const solved = problem.status === 'solved';

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white/55 transition hover:text-lime-300 focus:outline-none focus:ring-2 focus:ring-lime-300">
          <span aria-hidden="true">←</span> Back to problems
        </Link>

        <article className="mt-9">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${solved ? 'bg-lime-300/15 text-lime-300' : 'bg-orange-300/15 text-orange-200'}`}>
              {problem.status}
            </span>
            <span className="text-xs uppercase tracking-[0.14em] text-white/35">Problem hub</span>
          </div>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-paper sm:text-5xl">{problem.title}</h1>
          <p className="mt-5 text-sm text-white/40">
            Created {formatTimestamp(problem.createdAt)} · Updated {formatTimestamp(problem.updatedAt)}
          </p>

          <section className="mt-9 rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-card sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300">The messy version</p>
            {problem.rawContext ? (
              <pre className="mt-5 whitespace-pre-wrap break-words font-mono text-sm leading-7 text-white/75">{problem.rawContext}</pre>
            ) : (
              <p className="mt-5 text-sm text-white/40">No context was added to this brain dump.</p>
            )}
          </section>

          <section className="mt-7 rounded-3xl border border-lime-300/20 bg-lime-300/[0.07] p-5 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-lime-300">When you&apos;re ready</p>
            <h2 className="mt-3 text-2xl font-semibold text-paper">Take it for a run.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
              Start a thinking session and come back with one concrete next move.
            </p>
            <button
              type="button"
              disabled
              title="Live sessions are coming in iteration 2"
              className="mt-6 min-h-16 w-full cursor-not-allowed rounded-2xl bg-lime-300 px-6 text-lg font-black text-ink opacity-75 sm:w-auto sm:min-w-56"
            >
              Start run
            </button>
            <p className="mt-3 text-xs text-white/40">Coming in the live session · capture is ready now.</p>
          </section>

          <section className="mt-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/35">History</p>
                <h2 className="mt-2 text-2xl font-semibold text-paper">Thinking sessions</h2>
              </div>
              <span className="text-sm text-white/40">{sessions.length} total</span>
            </div>
            {sessions.length ? (
              <div className="mt-5 space-y-3">
                {sessions.map((session) => (
                  <div key={session.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                    <div className="flex flex-wrap justify-between gap-2 text-sm">
                      <span className="font-semibold text-paper">{formatTimestamp(session.startedAt)}</span>
                      <span className="text-white/40">{session.endedAt ? `Ended ${formatTimestamp(session.endedAt)}` : 'In progress'}</span>
                    </div>
                    {session.transcript ? (
                      <p className="mt-3 text-sm leading-6 text-white/55">{JSON.stringify(session.transcript)}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-white/15 px-5 py-9 text-sm text-white/40">
                No thinking sessions yet. This is where the trail will build.
              </div>
            )}
          </section>
        </article>
      </div>
    </main>
  );
}
