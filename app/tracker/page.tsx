import Link from 'next/link';
import { startDemoActivity } from '@/app/actions';
import type { ActivityKind } from '@/lib/activity';

export const dynamic = 'force-dynamic';

type TrackerPageProps = {
  searchParams: {
    outcome?: string;
    problem?: string;
  };
};

const activities: { kind: ActivityKind; label: string }[] = [
  { kind: 'run', label: 'Start run' },
  { kind: 'walk', label: 'Start walk' },
  { kind: 'cycle', label: 'Start cycle' },
  { kind: 'race', label: 'Start race' }
];

export default function TrackerPage({ searchParams }: TrackerPageProps) {
  const prompted = searchParams.outcome === 'prompted';
  const race = searchParams.outcome === 'race';
  const noOpenProblems = searchParams.outcome === 'no-open-problems';

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white/55 transition hover:text-lime-300 focus:outline-none focus:ring-2 focus:ring-lime-300">
          <span aria-hidden="true">←</span> Back to problems
        </Link>

        <header className="mt-9">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-lime-300">Simulated tracker</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-paper sm:text-6xl">
            Start moving. See what surfaces.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/55 sm:text-lg">
            Use these controls to play the activity trigger on camera.
          </p>
        </header>

        <section className="mt-9 rounded-3xl border border-orange-200/20 bg-orange-300/[0.07] p-5 shadow-card sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300">Activity start</p>
          <h2 className="mt-3 text-2xl font-semibold text-paper">What are you starting?</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {activities.map((activity) => (
              <form key={activity.kind} action={startDemoActivity.bind(null, activity.kind)}>
                <button
                  type="submit"
                  className="min-h-16 w-full rounded-2xl bg-lime-300 px-5 text-base font-black text-ink transition hover:bg-lime-200 focus:outline-none focus:ring-4 focus:ring-lime-300/30 active:scale-[0.99]"
                >
                  {activity.label}
                </button>
              </form>
            ))}
          </div>
        </section>

        {prompted ? (
          <section className="mt-7 rounded-3xl border border-lime-300/25 bg-lime-300/[0.08] p-5 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-lime-300">Prompt created</p>
            <h2 className="mt-3 min-w-0 break-words text-2xl font-semibold text-paper [overflow-wrap:anywhere]">
              {searchParams.problem}
            </h2>
            <Link
              href="/#activity-prompt"
              className="mt-6 inline-flex min-h-16 w-full items-center justify-center rounded-2xl bg-lime-300 px-6 text-base font-black text-ink transition hover:bg-lime-200 focus:outline-none focus:ring-4 focus:ring-lime-300/30 sm:w-auto"
            >
              View prompt on home
            </Link>
          </section>
        ) : null}

        {race ? (
          <section className="mt-7 rounded-3xl border border-orange-300/25 bg-orange-300/[0.08] p-5 sm:p-7">
            <p className="text-sm leading-6 text-orange-100">
              Race started. No prompt — nobody wants to solve work problems mid-race.
            </p>
          </section>
        ) : null}

        {noOpenProblems ? (
          <section className="mt-7 rounded-3xl border border-white/15 bg-white/[0.04] p-5 sm:p-7">
            <p className="text-sm leading-6 text-white/60">Activity recorded, but there are no open problems to prompt.</p>
          </section>
        ) : null}

        <section className="mt-7 rounded-3xl border border-lime-300/25 bg-lime-300/[0.07] p-5 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-lime-300">What&apos;s real here</p>
          <p className="mt-3 text-sm leading-7 text-white/65">
            Activity detection is simulated in this demo. A web app cannot observe a phone or watch starting a workout; a watch app or Strava integration would be the real signal, and that is later work.
          </p>
        </section>
      </div>
    </main>
  );
}
