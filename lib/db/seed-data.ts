import type { ProblemRow, SessionRow } from './schema';

export const seedProblems: ProblemRow[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Why does the CI job hang only on the second retry?',
    rawContext: `It is the integration-linux job in the payments repo. First run usually fails in 4-6 min with a timeout, then retry #1 passes, but every so often retry #2 just sits there until the 45 minute GitHub timeout.\\n\\nLast useful clue from the logs:\\n  waiting for postgres://localhost:5432\\n  connection refused (127.0.0.1:5432)\\n  testcontainers: waiting for container readiness\\n\\nThe runner has 2 vCPU / 7 GB. We started parallelizing the contract tests last week. Could be a leaked container or the service health check racing the test setup. Need to compare the job's container list before and after the retry, and check whether the cleanup step runs when pytest is killed.`,
    status: 'open',
    createdAt: new Date('2025-08-27T09:15:00.000Z'),
    updatedAt: new Date('2025-08-28T16:40:00.000Z')
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    title: 'Should we split the notification worker out of the API?',
    rawContext: `The worker is now doing about 38% of the API's CPU during the morning send window. Splitting it sounds clean, but the current process shares the feature-flag client, DB pool, and a tiny bit of retry state.\\n\\nConstraints:\\n- Team is two backend engineers through Q4.\\n- We cannot introduce Kafka just for this; SQS is already available.\\n- A deploy must not drop scheduled sends.\\n- The API currently owns the only dashboard for failed notifications.\\n\\nThe real question is whether this is an operational boundary or just an ugly function boundary. Maybe first move the queue consumer behind an internal interface and measure the actual failure modes for two weeks.`,
    status: 'open',
    createdAt: new Date('2025-08-22T13:05:00.000Z'),
    updatedAt: new Date('2025-08-25T11:20:00.000Z')
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    title: 'The query got slow after the customer_events migration',
    rawContext: `The weekly retention report went from ~9 seconds to 2m 14s after moving customer_events from the old partitioned table. Same date range, same approximate row count.\\n\\nEXPLAIN starts like this:\\n  Gather  (cost=1000.00..884321.22 rows=420 width=96)\\n    Workers Planned: 2\\n    ->  Parallel Seq Scan on customer_events\\n       Filter: ((account_id = $1) AND (occurred_at >= $2))\\n\\nThere is an index on (occurred_at), but not account_id first. The migration also changed occurred_at from timestamp to timestamptz. Need to check stats freshness, compare the old query plan, and test a partial composite index before touching the report code.`,
    status: 'solved',
    createdAt: new Date('2025-08-15T08:30:00.000Z'),
    updatedAt: new Date('2025-08-19T17:10:00.000Z')
  }
];

export const seedSessions: SessionRow[] = [
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    problemId: '33333333-3333-4333-8333-333333333333',
    startedAt: new Date('2025-08-15T12:00:00.000Z'),
    endedAt: new Date('2025-08-15T12:28:00.000Z'),
    transcript: { note: 'Compared the old and new plans; the planner stopped using the account filter.' }
  },
  {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    problemId: '33333333-3333-4333-8333-333333333333',
    startedAt: new Date('2025-08-17T07:45:00.000Z'),
    endedAt: new Date('2025-08-17T08:05:00.000Z'),
    transcript: { note: 'Tested a composite index locally. Runtime dropped below 11 seconds.' }
  }
];
