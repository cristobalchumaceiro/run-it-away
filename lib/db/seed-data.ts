import type { ProblemRow, SessionRow } from './schema';

function daysAgo(days: number, hour = 9, minute = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date;
}

export const seedProblems: ProblemRow[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Seminar attendance collapses in week six, every single term',
    rawContext: `Twenty-two enrolled, eighteen or nineteen show up until week five, then it drops to eight or nine and never recovers. Same shape last year and the year before, across two different rooms and two different times of day.

What I know:
- The reading load roughly doubles in week six, when the primary sources come in.
- The first assessed essay is due in week eight.
- The students who stop coming are not the ones doing badly; several of them are the strongest writers.
- Attendance is not graded, and I do not want it to be.

So it is probably not laziness and probably not the room. It may be that week six is where the course stops rewarding attendance: once they have the reading list, the seminar looks optional next to the essay deadline. Worth deciding whether to restructure the reading, move the deadline, or change what actually happens in the room in week six.`,
    status: 'open',
    pinned: false,
    createdAt: daysAgo(2, 9, 15),
    updatedAt: daysAgo(1, 16, 40)
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    title: 'Should the literature review be organised by method or by chronology?',
    rawContext: `Chronology is the easy write: it tells a story, and the shift in the field around 2014 falls out naturally. But it buries the thing I actually want to argue, which is that two incompatible measurement approaches have been talking past each other for a decade.

Organising by method puts that front and centre, at a cost:
- Three papers refuse to sit in one camp and would need to appear twice.
- My supervisor's own work reads more naturally in the chronological version.
- The reader loses the sense of the field moving, which matters for the funding case in chapter one.

The real question is whether the review is there to summarise the field or to set up my contribution. If it is the latter, chronology is a comfortable mistake.`,
    status: 'open',
    pinned: false,
    createdAt: daysAgo(7, 13, 5),
    updatedAt: daysAgo(4, 11, 20)
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    title: 'The headline finding flips when the sample is weighted',
    rawContext: `Unweighted, the effect is a clean 6.2 points in favour. Applying the demographic weights the funder asked for, it goes to -1.4 and the confidence interval crosses zero. Same respondents, same question wording.

Where it came apart:
  under-25 respondents: 11% of the sample, 24% of the population
  weight applied to that cell: 2.2
  and that cell is the only one where the effect runs the other way

So the whole result rests on about forty people who are being counted twice over. That is not a finding, it is a sampling problem wearing a finding's clothes. Need to say plainly in the write-up which estimate is reported and why, rather than quietly picking the flattering one.`,
    status: 'solved',
    pinned: false,
    createdAt: daysAgo(14, 8, 30),
    updatedAt: daysAgo(10, 17, 10)
  }
];

export const seedSessions: SessionRow[] = [
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    problemId: '33333333-3333-4333-8333-333333333333',
    trigger: 'manual',
    startedAt: daysAgo(14, 12, 0),
    endedAt: daysAgo(14, 12, 28),
    transcript: { note: 'Checked which cell the weights were doing the work in. It was the under-25s, on their own.' }
  },
  {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    problemId: '33333333-3333-4333-8333-333333333333',
    trigger: 'manual',
    startedAt: daysAgo(12, 7, 45),
    endedAt: daysAgo(12, 8, 5),
    transcript: { note: "Recomputed with the funder's weights and without. Decided to report both, with the caveat stated up front." }
  }
];
