import { saveBrainDump } from '@/app/actions';

export function QuickCapture({ error }: { error?: string }) {
  return (
    <form action={saveBrainDump} className="rounded-3xl border border-orange-200/15 bg-orange-300/[0.07] p-5 shadow-card sm:p-7">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300">Brain dump</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-paper">Get it out of your head.</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
          Name the knot, then dump the messy version. No organizing required.
        </p>
      </div>
      <div className="space-y-4">
        <label className="block">
          <span className="sr-only">Problem title</span>
          <input
            name="title"
            required
            placeholder="What are you stuck on?"
            className="min-h-14 w-full rounded-2xl border border-white/15 bg-black/25 px-4 text-base text-paper outline-none placeholder:text-white/35 focus:border-lime-300 focus:ring-2 focus:ring-lime-300/20"
          />
        </label>
        <label className="block">
          <span className="sr-only">Brain dump context</span>
          <textarea
            name="rawContext"
            rows={7}
            placeholder="Thoughts, code snippets, constraints, obstacles… dump everything here."
            className="w-full resize-y rounded-2xl border border-white/15 bg-black/25 px-4 py-4 text-base leading-7 text-paper outline-none placeholder:text-white/35 focus:border-lime-300 focus:ring-2 focus:ring-lime-300/20"
          />
        </label>
      </div>
      {error === 'title' ? <p className="mt-3 text-sm text-orange-200">Give the problem a title first.</p> : null}
      <button
        type="submit"
        className="mt-5 min-h-14 w-full rounded-2xl bg-lime-300 px-5 text-base font-bold text-ink transition hover:bg-lime-200 focus:outline-none focus:ring-4 focus:ring-lime-300/30 active:scale-[0.99] sm:w-auto"
      >
        Save and step away
      </button>
    </form>
  );
}
