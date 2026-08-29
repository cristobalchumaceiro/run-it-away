import { notFound, redirect } from 'next/navigation';
import { endThinkingSession } from '@/app/actions';
import { ElapsedTime } from '@/components/elapsed-time';
import { VoiceAgent } from '@/components/voice-agent';
import { getProblem, getSession, listNotesForProblem, listNotesForSession } from '@/lib/db';
import type { NoteRow } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

function formatNoteKind(kind: 'voice' | 'text' | 'next_step') {
  if (kind === 'voice') return 'Dictated thought';
  if (kind === 'next_step') return 'Next step';
  return 'Thought';
}

function buildProblemContext(title: string, rawContext: string | null, notes: NoteRow[]) {
  const noteLines = notes.map(
    (note) =>
      `${formatNoteKind(note.kind)}: ${note.body}${note.uncertain ? ' (possibly misheard)' : ''}`
  );
  const lines = [
    `Problem: ${title}`,
    `Background: ${rawContext || 'No additional background was provided.'}`,
    'Existing thinking, oldest first:',
    ...noteLines
  ];
  while (lines.length > 3 && lines.join('\n').length > 4000) lines.splice(3, 1);
  return lines.join('\n');
}

export default async function SessionPage({ params }: { params: { id: string } }) {
  const session = await getSession(params.id);
  if (!session) notFound();
  if (session.endedAt) redirect(`/session/${session.id}/reflect`);

  const problem = await getProblem(session.problemId);
  if (!problem) notFound();
  const notes = await listNotesForSession(session.id);
  const problemNotes = await listNotesForProblem(problem.id);
  const problemContext = buildProblemContext(problem.title, problem.rawContext, problemNotes);
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID?.trim();

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
          {agentId ? (
            <VoiceAgent
              sessionId={session.id}
              problemId={problem.id}
              problemContext={problemContext}
              agentId={agentId}
            />
          ) : (
            <div className="mt-6 rounded-2xl border border-orange-300/25 bg-orange-300/[0.07] p-5">
              <p className="text-base leading-7 text-orange-100">
                The voice agent isn&apos;t configured. Set NEXT_PUBLIC_ELEVENLABS_AGENT_ID to enable voice calls.
              </p>
            </div>
          )}
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

        {!agentId ? (
          <form className="mt-10" action={endThinkingSession.bind(null, session.id)}>
            <button
              type="submit"
              className="min-h-16 w-full rounded-2xl bg-orange-300 px-6 text-lg font-black text-ink transition hover:bg-orange-200 focus:outline-none focus:ring-4 focus:ring-orange-300/30 active:scale-[0.99]"
            >
              End run
            </button>
          </form>
        ) : null}
      </div>
    </main>
  );
}
