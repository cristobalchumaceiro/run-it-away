# Run It Away

**Capture the problem. Run. Come back with the answer.**

Run It Away is a companion app for people who think best when their blood is moving. You jot down the problems you're stuck on — at work, at school, in life — and the app surfaces them at the moment you're most likely to crack them: the moment you start moving.

> Built at a running hackathon, where the builder has to be running laps and only the runner is allowed to build.

---

## The idea

Aerobic exercise increases cerebral blood flow and is associated with improved divergent thinking and problem solving. Most people have experienced it: the answer arrives mid-run, mid-walk, mid-shower — never at the desk.

The problem is that the answer arrives *unprompted and unaimed*. You don't choose what your brain chews on, and when you do have a good thought at km 4, it's gone by the time you've stretched.

Run It Away closes that loop:

1. **Capture** the problem when it's bothering you (at the desk, in a meeting, in bed).
2. **Get prompted** when your tracker detects that an activity has started: *"You're heading out. Want to think about 'How do we price the new tier?' today?"*
3. **Think while you move** — hands-free, with optional voice capture for the thoughts that land.
4. **Reflect afterwards**, while the endorphins are still up, and update the note with where you got to.

Over time each problem accumulates a trail of thinking sessions, so you can see a problem being worn down run by run.

---

## Core features

### 1. Problem notes
The atomic unit of the app is a **problem**, not a task. A problem has:

- a short title (the question you'd ask a friend)
- optional context / constraints / what you've already tried
- a status: `open`, `mulling`, `cracked`, `parked`
- tags (`work`, `thesis`, `relationship`, `side-project`)
- a history of **thinking sessions** attached to it

### 2. Activity-triggered prompting
When a connected tracker reports the start of an activity, Run It Away sends a single, low-friction notification:

> 🏃 Activity started — think about *"Should we rewrite the ingest pipeline?"*
> [Yes] [Pick another] [Not today]

Selection heuristics (v1): most recently updated open problem, longest-neglected problem, or a problem the user pinned as "next up". Never more than one prompt per activity.

### 3. Hands-free capture during activity
- **Voice memos** — one tap (or a headphone gesture), speak, transcribe automatically into the problem's session log.
- **Quick markers** — mark a moment as *insight* / *dead end* without stopping.

### 4. Post-activity reflection
Within a configurable window after the activity ends (default 30 minutes, the "warm window"), the app nudges you once to update the note: what changed, what's the next concrete step, and whether the status moved.

### 5. Problem journal
A per-problem timeline: every prompt, every session, every voice note, every status change — plus stats like *distance run against this problem* and *time to crack*.

---

## Integrations

Run It Away doesn't try to be a tracker. It listens to the ones you already use.

| Source | Mechanism | Notes |
| --- | --- | --- |
| **Apple Health / HealthKit** | On-device workout observation | Activity start detection via workout session events; runs, walks, cycling, rowing |
| **Strava** | Webhook subscription (activity create/update) | Strava's webhooks are activity-*upload* oriented, so on their own they mostly power post-activity reflection rather than live start prompts |
| **Garmin / Coros / Polar** | Vendor APIs / Health SDKs | Roadmap |
| **Manual** | "Start thinking session" button | Always available; no wearable required |

**Design note:** reliable *start-of-activity* detection is the crux of the product and is easiest on-device (HealthKit workout events, or motion-based auto-detect). Cloud webhooks from services like Strava generally fire once an activity is finished/uploaded. The plan is therefore on-device detection for the live prompt, cloud integrations to enrich and to catch activities the phone missed.

---

## User journeys

**The desk capture**
Ana is stuck on how to structure a pricing tier. She opens Run It Away, types the question, adds two constraints, closes the app. 20 seconds.

**The run prompt**
Two days later she starts a run; her watch begins a workout. Her phone buzzes once: *think about pricing today?* She taps Yes and puts the phone away.

**The insight**
At km 5 she says out loud into her headphones: "usage-based for teams, flat for solo, and cap the overage." Marked as an insight.

**The warm window**
Back home, the app asks her to close the loop. She reads the transcript, writes two lines, and moves the problem from `mulling` to `cracked`. Next step: "draft the pricing page."

---

## Product principles

1. **One prompt, one problem.** The app interrupts at most once per activity, and never mid-thought.
2. **No screens while moving.** Anything required during activity must be doable by voice or a single tap.
3. **Notes are for thinking, not for tracking.** No streaks, no guilt, no gamified pressure.
4. **Your body data stays yours.** Health data is read for one signal — "an activity started" — and is not stored beyond what's needed to attach a session to an activity.

---

## Architecture sketch

```
┌──────────────────────┐        ┌──────────────────────┐
│  Mobile app          │        │  Backend             │
│  ──────────          │        │  ───────             │
│  Problem capture UI  │◄──────►│  Problems / sessions │
│  HealthKit observer  │        │  API                 │
│  Local notifications │        │  Prompt selection    │
│  Voice capture       │        │  Transcription       │
└──────────────────────┘        │  Integration hub     │
                                │   ├─ Strava webhooks │
                                │   └─ Garmin, Coros   │
                                └──────────────────────┘
```

Suggested stack (hackathon-friendly): React Native / Expo client, HealthKit via a workout-observer module, Node or Python API, Postgres, on-device or hosted speech-to-text.

### Data model (v1)

```
Problem   id, title, context, status, tags[], pinned, created_at, updated_at
Session   id, problem_id, activity_id?, started_at, ended_at, source
Note      id, problem_id, session_id?, kind (text|voice|marker), body, created_at
Activity  id, source (healthkit|strava|manual), type, started_at, ended_at, distance, duration
Prompt    id, problem_id, activity_id, sent_at, response (accepted|swapped|declined)
```

---

## Scope

**Hackathon MVP**
- Create / edit / list problem notes
- Manual "start thinking session" + post-session reflection
- HealthKit (or simulated) activity-start trigger → single prompt
- Voice memo attached to a session, transcribed
- Problem journal view

**Next**
- Strava sync for post-activity reflection and activity enrichment
- Smarter prompt selection (neglect + user intent + activity length)
- Garmin / Coros / Polar
- Weekly digest: what you thought about, what moved
- Shared problems for teams and study groups

**Explicitly not in scope**
- Being a training log or a fitness tracker
- A general to-do app
- Social feed / leaderboards

---

## Open questions

- How do we detect activity start reliably enough for the prompt to feel magical, on Android as well as iOS?
- Should walking count by default, or only sustained aerobic activity?
- Is one problem per activity the right constraint, or should long activities allow a second?
- How much structure should a problem have before it's worth prompting about?

---

## Status

Concept and README. Built at a hackathon; contributions and forks welcome.

---

## Getting started / running locally

Run It Away is a Next.js App Router app with a Postgres schema managed by Drizzle.
The app also has a seeded in-memory fallback, so it runs locally and builds on
Vercel without database provisioning.

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

### Optional Postgres

Set `DATABASE_URL` to a Postgres connection string (Neon works well for Vercel):

```bash
export DATABASE_URL="postgres://..."
npx drizzle-kit migrate
npx tsx lib/db/seed.ts
```

When `DATABASE_URL` is unset, the app uses the same demo problems and sessions
from an in-memory repository. That fallback resets when a server process or
serverless instance restarts; it is intended for demos, not persistence.

### Voice agent

Set `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` to the id of a public ElevenLabs agent
with authentication disabled. The browser connects with that agent id alone;
this app does not use or require an ElevenLabs API key.
