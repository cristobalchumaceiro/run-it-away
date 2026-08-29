# Run It Away — Build Plan (5-hour hackathon)

This is the build plan for the demo, structured as three iterations. It assumes the
constraints of this hackathon: **one person runs laps while the other builds**, and the
total budget of **5 hours covers code, slides, and the video** — not just code.

It also incorporates the red-team review of the README. Two of its conclusions shape
this plan directly:

1. **Live activity-start detection is not a web capability.** A Next.js app on Vercel
   cannot observe HealthKit workout starts or Health Connect sessions. So we do not
   fake it and claim it works. The trigger is either **user-initiated** or **an
   explicit, visible simulated tracker event** — and we say so on the slide.
2. **The defensible core is problem selection + closure**, not voice notes. So the
   thing we must get working end to end is: *pick a problem → think while moving →
   come back with one concrete next action.*

---

## Time budget

| Block | Duration | Owner | Output |
| --- | --- | --- | --- |
| Iteration 1 | 0:00 – 1:15 | builder A | Deployed, usable core loop |
| Iteration 2 | 1:15 – 2:45 | builder B | Trigger + hands-free capture |
| Iteration 3 | 2:45 – 3:45 | builder A | Journal, polish, demo seed data |
| Slides | 3:45 – 4:20 | runner (off-lap) | 8-slide deck |
| Video + buffer | 4:20 – 5:00 | both | Recorded walkthrough, final deploy |

**Hard rule:** deploy to Vercel at the end of *every* iteration. A deployed iteration 1
beats a half-finished iteration 3. If a block overruns, cut scope inside the block —
never borrow from the slides/video block.

**Lap-swap rule:** each iteration is sliced into tasks of ~20 minutes that end in a
committed, deployable state, so a handover mid-iteration never loses work.

---

## Tech stack

Chosen for one reason: **zero-config Vercel deploy and no time lost to infrastructure.**

| Concern | Choice | Why |
| --- | --- | --- |
| Framework | **Next.js (App Router) + TypeScript** | One deploy target, server actions mean no separate API layer |
| Styling | **Tailwind CSS** + a small component set (shadcn/ui) | Fast, looks good in a video without design time |
| Data | **Vercel Postgres** (or **Supabase**) via Drizzle or Prisma | Managed, no local DB setup; falls back to a JSON seed if it fights us |
| Auth | **None in iterations 1–2**; single hardcoded demo user | Auth is the classic hackathon time sink and adds nothing to the demo |
| Voice capture | **Web Speech API** (`SpeechRecognition`) in Chrome, with `MediaRecorder` as fallback | Free, in-browser, no transcription vendor or API key |
| Activity trigger | Manual "Start activity" + a visible **Simulated Tracker** panel | Honest, deterministic, and demoable on a laptop |
| Notifications | In-app + **Web Notifications API** if trivially available | Push on mobile web is not worth the time |
| Deploy | **Vercel**, pushed from `main` | Preview URL per commit, shareable in the video |

**Explicitly deferred:** HealthKit, Health Connect, Strava OAuth, native app, real
push notifications, cloud transcription, multi-user auth, tests beyond typecheck.

### Project structure

```
run-it-away/
├─ app/
│  ├─ page.tsx                    # Problem inbox (list + quick capture)
│  ├─ problems/[id]/page.tsx      # Problem detail + journal timeline
│  ├─ session/[id]/page.tsx       # Active thinking session (big-tap, hands-free)
│  ├─ session/[id]/reflect/page.tsx  # Post-activity: one next action
│  ├─ tracker/page.tsx            # Simulated tracker control panel (demo tool)
│  └─ api/
│     └─ tracker/activity-start/route.ts  # Webhook the simulator (or Strava) calls
├─ components/
│  ├─ problem-card.tsx
│  ├─ quick-capture.tsx
│  ├─ activity-prompt.tsx         # "Think about X today?" [Yes][Swap][Not today]
│  ├─ voice-capture.tsx
│  └─ timeline.tsx
├─ lib/
│  ├─ db/            schema.ts, client.ts, seed.ts
│  ├─ prompt-select.ts            # which problem to surface (pure, testable)
│  └─ types.ts
└─ PLAN.md, README.md
```

### Data model (trimmed from the README for 5 hours)

```ts
Problem  { id, title, context, status: 'open'|'mulling'|'cracked'|'parked', pinned, createdAt, updatedAt }
Session  { id, problemId, source: 'manual'|'simulated'|'strava', startedAt, endedAt }
Note     { id, problemId, sessionId?, kind: 'text'|'voice', body, createdAt }
```

Dropped for now: `Activity`, `Prompt`, tags, markers, distance stats. `Prompt` response
tracking is nice for the metrics story but is not visible in a 3-minute video.

---

## Iteration 1 — the core loop, deployed (0:00 – 1:15)

**Goal:** a stranger can capture a problem, start a thinking session, and finish with one
next action. No trigger, no voice. This is the iteration that must not fail.

1. `create-next-app` (TS, Tailwind, App Router), push, connect Vercel, confirm the live
   URL. *(15 min — do this first, not last.)*
2. Schema + client + seed with 3 realistic demo problems. *(15 min)*
3. Problem inbox: list, one-field quick capture (title only, Enter to save), status chip. *(20 min)*
4. Problem detail: context field, status control. *(10 min)*
5. Session flow: **Start thinking session** → session screen with the problem title huge
   → **End session** → reflect screen with one field: *"What's the next step?"* → saves
   as a note and returns to the problem. *(15 min)*

**Done when:** deployed URL, capture → session → next action works, next action visible
on the problem.

**Cut first if late:** the status control, the context field.

---

## Iteration 2 — the trigger and hands-free capture (1:15 – 2:45)

**Goal:** the differentiated moment. An activity start surfaces exactly one prompt, and
the runner can talk instead of type.

1. `lib/prompt-select.ts` — pure function picking one problem: pinned first, else
   longest-neglected `open`/`mulling`. Never returns `cracked`/`parked`. *(15 min)*
2. `POST /api/tracker/activity-start` — accepts `{ source, activityType, startedAt }`,
   selects a problem, creates a pending prompt. *(15 min)*
3. **Simulated Tracker panel** at `/tracker` — buttons: *Start run*, *Start walk*,
   *Start race (should not prompt)*. This is the demo instrument; make it look
   deliberate, not like a debug page. *(15 min)*
4. `ActivityPrompt` — one card, one problem, three actions: **Yes** / **Swap** /
   **Not today**. At most one prompt per activity, enforced server-side. *(20 min)*
5. Voice capture in the session screen: one big button, Web Speech API live transcript
   appended to the session as a `voice` note; keep the raw text even if recognition is
   flaky, and show an explicit *"transcription may be wrong"* state. *(25 min)*

**Done when:** clicking *Start run* in the tracker panel produces exactly one prompt,
accepting it opens the session, and speaking produces a saved note.

**Cut first if late:** *Swap*, the race/no-prompt case, `MediaRecorder` fallback.

---

## Iteration 3 — the story, polish, and demo readiness (2:45 – 3:45)

**Goal:** make it look like a product and make the demo repeatable.

1. Journal timeline on the problem detail: every session, note, and status change in
   order — this is what sells "a problem worn down run by run". *(20 min)*
2. Seed a problem with **three past sessions already on it** so the timeline isn't
   empty on camera. Highest-value 10 minutes in the whole plan. *(10 min)*
3. Mobile-width polish: the session screen must be thumb-sized and readable at arm's
   length; check it at 390px. *(15 min)*
4. Empty states, the honesty line in the footer (*"activity detection is simulated in
   this demo"*), favicon/title, `npm run build` + typecheck clean, final deploy. *(15 min)*

**Cut first if late:** everything except items 2 and 4.

---

## Slides (3:45 – 4:20) — 8 slides

1. **Hook** — "The answer always arrives at km 4. And it's gone by km 5."
2. **Problem** — insight during movement is unprompted, unaimed, and unrecorded.
3. **Idea** — capture the problem, get prompted when you start moving, come back with a next action.
4. **Demo** — live URL / recorded clip.
5. **Why it works** — honest version: research suggests moderate exercise gives
   small-to-moderate short-term gains on creative-ideation tasks; we're testing whether
   structured capture converts movement thoughts into next actions.
6. **What's real vs. simulated** — web app is real; activity-start detection is
   simulated, because it needs on-device HealthKit / a watch app. Saying this
   *pre-empts* the judges' hardest question.
7. **Roadmap** — Watch app owning the workout session, Strava for post-activity
   enrichment, privacy-first local audio.
8. **Riskiest assumption + the 14-day Wizard-of-Oz test we'd run next.**

## Video (4:20 – 5:00)

One take, ≤3 minutes, screen recording with voiceover, following exactly the
iteration-3 seeded path: inbox → tracker *Start run* → prompt → accept → speak a
thought → end → one next action → timeline showing four sessions on that problem.
Record it against the **deployed** URL, not localhost. Keep the last 15 minutes as
buffer for a re-record.

---

## Risk register

| Risk | Mitigation |
| --- | --- |
| Web Speech API misbehaves in the demo room (noise, permissions, browser) | Text fallback always visible; pre-grant mic permission; if it fails, demo text capture and say voice is Chrome-only |
| DB setup eats the clock | Fall back to a JSON file / in-memory store behind the same `lib/db` interface |
| Vercel deploy fails late | Deploy at the end of every iteration, so there's always a working URL |
| Judges ask "does the trigger actually work?" | Slide 6 answers it before they ask |
| Lap swap loses context | 20-minute committed tasks; this file is the shared source of truth |
| Scope creep into iteration 3 features | Cut lists are pre-written per iteration — follow them |
