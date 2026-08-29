import Link from 'next/link';
import { notFound } from 'next/navigation';
import { startThinkingSession, toggleProblemPinned } from '@/app/actions';
import { getProblem, listNotesForSession, listSessionsForProblem } from '@/lib/db';

export const dynamic = 'force-dynamic';

function formatTimestamp(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getTranscriptText(transcript: unknown): string | null {
  if (typeof transcript === 'string') return transcript;
  if (isJsonObject(transcript) && typeof transcript.note === 'string') return transcript.note;
  return null;
}

function formatDuration(startedAt: Date, endedAt: Date | null) {
  if (!endedAt) return 'Still in progress';
  const minutes = Math.floor(Math.max(0, endedAt.getTime() - startedAt.getTime()) / 60000);
  return minutes === 0 ? 'Less than a minute' : `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

export default async function ProblemHub({ params }: { params: { id: string } }) {
  const problem = await getProblem(params.id);
  if (!problem) notFound();

  const sessions = await listSessionsForProblem(problem.id);
  const sessionsWithNotes = await Promise.all(
    sessions.map(async (session) => ({ session, notes: await listNotesForSession(session.id) }))
  );
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
            <form className="ml-auto" action={toggleProblemPinned.bind(null, problem.id, !problem.pinned)}>
              <button
                type="submit"
                aria-pressed={problem.pinned}
                className={`min-h-11 rounded-full border px-4 text-xs font-bold uppercase tracking-[0.14em] transition focus:outline-none focus:ring-2 focus:ring-lime-300 ${
                  problem.pinned
                    ? 'border-lime-300/40 bg-lime-300/15 text-lime-200 hover:bg-lime-300/25'
                    : 'border-white/15 text-white/55 hover:border-lime-300/40 hover:text-lime-200'
                }`}
              >
                {problem.pinned ? 'Unpin problem' : 'Pin problem'}
              </button>
            </form>
          </div>
          <h1 className="mt-5 break-words text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-paper [overflow-wrap:anywhere] sm:text-5xl">{problem.title}</h1>
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
            <form action={startThinkingSession.bind(null, problem.id)}>
              <button
                type="submit"
                className="mt-6 min-h-16 w-full rounded-2xl bg-lime-300 px-6 text-lg font-black text-ink transition hover:bg-lime-200 focus:outline-none focus:ring-4 focus:ring-lime-300/30 active:scale-[0.99] sm:w-auto sm:min-w-56"
              >
                Start thinking session
              </button>
            </form>
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
                {sessionsWithNotes.map(({ session, notes }) => {
                  const transcript = getTranscriptText(session.transcript);
                  const nextStep = notes.find((note) => note.kind === 'next_step');
                  const otherNotes = notes.filter((note) => note.kind !== 'next_step');

                  return (
                    <div key={session.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                      <p className="text-sm leading-6 text-white/55">
                        On {formatTimestamp(session.startedAt)}, you took this problem for a{' '}
                        <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/65">
                          {session.trigger === 'tracker' ? 'Tracker' : 'Manual'}
                        </span>{' '}
                        session. {formatDuration(session.startedAt, session.endedAt)}.
                      </p>
                      {nextStep ? (
                        <p className="mt-4 text-base leading-7 text-paper">
                          <span className="font-bold text-lime-300">Next step:</span> {nextStep.body}
                        </p>
                      ) : null}
                      {otherNotes.map((note) => (
                        <p key={note.id} className="mt-3 text-sm leading-6 text-white/65">
                          <span className="font-semibold text-white/80">
                            {note.kind === 'voice' ? 'You said (may be misheard):' : 'You noted:'}
                          </span>{' '}
                          {note.body}
                        </p>
                      ))}
                      {transcript !== null ? <p className="mt-3 text-sm leading-6 text-white/55">Earlier note: {transcript}</p> : null}
                    </div>
                  );
                })}
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
