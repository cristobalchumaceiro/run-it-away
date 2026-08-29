import Link from 'next/link';
import type { ProblemRow } from '@/lib/db/schema';

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

export function ProblemCard({ problem }: { problem: ProblemRow }) {
  const solved = problem.status === 'solved';

  return (
    <Link
      href={`/problems/${problem.id}`}
      className="group block rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-card transition hover:-translate-y-0.5 hover:border-orange-300/40 hover:bg-white/[0.075] focus:outline-none focus:ring-2 focus:ring-lime-300"
    >
      <div className="flex min-w-0 items-start justify-between gap-4">
        <h2 className="min-w-0 flex-1 break-words text-lg font-semibold leading-snug text-paper [overflow-wrap:anywhere] transition group-hover:text-orange-200">
          {problem.title}
        </h2>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${
            solved ? 'bg-lime-300/15 text-lime-300' : 'bg-orange-300/15 text-orange-200'
          }`}
        >
          {problem.status}
        </span>
      </div>
      <p className="mt-4 text-sm text-white/45">Dumped {formatDate(problem.createdAt)}</p>
    </Link>
  );
}
