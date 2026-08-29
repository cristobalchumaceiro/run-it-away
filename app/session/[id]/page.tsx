import { notFound, redirect } from 'next/navigation';
import { endThinkingSession } from '@/app/actions';
import { ElapsedTime } from '@/components/elapsed-time';
import { VoiceCapture } from '@/components/voice-capture';
import { getProblem, getSession, listNotesForSession } from '@/lib/db';

export const dynamic = 'force-dynamic';

function formatNoteKind(kind: 'voice' | 'text' | 'next_step') {
  if (kind === 'voice') return 'Dictated thought';
  if (kind === 'next_step') return 'Next step';
  return 'Thought';
}

export default async function SessionPage({ params }: { params: { id: string } }) {
  const session = await getSession(params.id);
  if (!session) notFound();
  if (session.endedAt) redirect(`/session/${session.id}/reflect`);

  const problem = await getProblem(session.problemId);
  if (!problem) notFound();
  const notes = await listNotesForSession(session.id);

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <header className="border-b border-white/10 pb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300">Thinking session</p>
          <h1 className="mt-5 min-w-0 break-words text-4xl font-semibold leading-[1.03] tracking-[-0.045em] text-paper [overflow-wrap:anywhere] sm:text-6xl">
            {problem.title}
          </h1>
          <div className="mt-6 flex items-center justify-between gap-4 text-sm text-white/50">
            <span>Time away</span>
            <span className="text-2xl font-semibold tabular-nums text-lime-300">
              <ElapsedTime startedAt={session.startedAt} />
            </span>
          </div>
        </header>

        <section className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-lime-300">Capture without stopping</p>
          <VoiceCapture sessionId={session.id} problemId={problem.id} />
        </section>

        {notes.length ? (
          <section className="mt-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/35">Captured so far</p>
            <div className="mt-4 space-y-3">
              {notes.map((note) => (
                <article key={note.id} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange-200">{formatNoteKind(note.kind)}</p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-base leading-7 text-white/80 [overflow-wrap:anywhere]">{note.body}</p>
                  {note.uncertain ? <p className="mt-2 text-xs text-orange-100/70">Speech recognition may have misheard this.</p> : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <form className="mt-10" action={endThinkingSession.bind(null, session.id)}>
          <button
            type="submit"
            className="min-h-16 w-full rounded-2xl bg-orange-300 px-6 text-lg font-black text-ink transition hover:bg-orange-200 focus:outline-none focus:ring-4 focus:ring-orange-300/30 active:scale-[0.99]"
          >
            End run
          </button>
        </form>
      </div>
    </main>
  );
}
