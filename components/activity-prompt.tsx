import { acceptPrompt, declinePrompt, swapPrompt } from '@/app/actions';
import type { ActivityRow, ProblemRow, PromptRow } from '@/lib/db/schema';

function activityLabel(kind: ActivityRow['kind']) {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

export function ActivityPrompt({
  prompt,
  activity,
  problem
}: {
  prompt: PromptRow;
  activity: ActivityRow;
  problem: ProblemRow;
}) {
  return (
    <section id="activity-prompt" className="mb-10 rounded-3xl border border-orange-300/30 bg-orange-300/[0.1] p-5 shadow-card sm:p-7">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300">A moment to think</p>
      <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.03em] text-paper">Want to think about this today?</h2>
      <h3 className="mt-5 min-w-0 break-words text-2xl font-semibold leading-tight text-paper [overflow-wrap:anywhere]">
        {problem.title}
      </h3>
      <p className="mt-4 text-sm leading-6 text-white/55">
        {activityLabel(activity.kind)} started · simulated activity detection
      </p>
      <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
        <form action={acceptPrompt.bind(null, prompt.id)}>
          <button
            type="submit"
            className="min-h-16 w-full rounded-2xl bg-lime-300 px-7 text-base font-black text-ink transition hover:bg-lime-200 focus:outline-none focus:ring-4 focus:ring-lime-300/30 active:scale-[0.99] sm:w-auto"
          >
            Yes
          </button>
        </form>
        <form action={swapPrompt.bind(null, prompt.id)}>
          <button
            type="submit"
            className="min-h-16 w-full rounded-2xl border border-white/15 px-7 text-base font-bold text-paper transition hover:border-lime-300/50 hover:text-lime-200 focus:outline-none focus:ring-2 focus:ring-lime-300 sm:w-auto"
          >
            Swap
          </button>
        </form>
        <form action={declinePrompt.bind(null, prompt.id)}>
          <button
            type="submit"
            className="min-h-16 w-full rounded-2xl border border-white/15 px-7 text-base font-bold text-paper transition hover:border-orange-300/50 hover:text-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300 sm:w-auto"
          >
            Not today
          </button>
        </form>
      </div>
    </section>
  );
}
