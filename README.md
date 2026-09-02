# Run It Away

**Pick one problem. Think about it while you move. Come back with one concrete next step.**

Live demo: **https://run-it-away.vercel.app**

Most people have had the experience of the answer arriving mid-run rather than at the desk. The trouble is it arrives unaimed — you don't choose what your brain chews on, and a good thought at kilometre four is gone by the time you've stretched. Run It Away aims that time on purpose.

Built at a running hackathon, where you had to be out running to be allowed to build.

## The loop

1. **Dump the problem** when it's loud — a title and the messy version, no organising required.
2. **Start moving.** The app asks once: *"Want to think about this today?"* — with one problem chosen for you.
3. **Talk it through** on the mid-run screen: the problem large enough to read at arm's length, and a live voice conversation with a sparring partner so you never have to type.
4. **When the run ends**, one question: *What's the next step?*
5. **Read the problem getting worn down**, run by run, as plain sentences on its page.

## What's interesting about it

**Choosing the problem is the actual product.** Anything can record a voice note. The app picks the one problem worth carrying: the one you pinned, otherwise the open one you've neglected longest, and never one you've already solved.

**Not every activity is for thinking.** A run, a walk or a cycle prompts you. A race never does — nobody wants to solve work problems mid-race.

**It's honest about the speech.** Whatever the transcription heard is kept as-is and shown as possibly wrong, rather than quietly cleaned up or thrown away.

## Try the demo

- The three seeded problems are academic ones: seminar attendance collapsing in week six, whether a literature review should be organised by method or chronology, and a survey finding that flips when the sample is weighted.
- **Simulated tracker** (linked from the home page) is where you start a run, walk, cycle or race. Activity detection is genuinely simulated: a web app can't observe a phone or watch starting a workout. Doing that for real needs a watch app or a Strava-style integration, which is where this would go next.
- The demo has no database, so anything you add resets. The seeded problems always come back.
- **The voice call needs ElevenLabs credit on the configured account.** Once that runs out the call won't connect; the rest of the app still works, and you'll see the connection error on the mid-run screen.

## Running it locally

A Next.js App Router app, with a Postgres schema managed by Drizzle and a seeded in-memory fallback so it runs with no setup.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

With `DATABASE_URL` unset the app serves the demo problems from memory and resets when the server restarts. To persist, point it at Postgres (Neon works well on Vercel):

```bash
export DATABASE_URL="postgres://..."
npx drizzle-kit migrate
npx tsx lib/db/seed.ts
```

For the voice call, set `ELEVENLABS_AGENT_ID` and `ELEVENLABS_API_KEY`. The server uses the key to mint a short-lived WebRTC conversation token, so it never reaches the browser. Without both, the mid-run screen says so and you can still end the run and answer the reflection question.

## Status

Hackathon project, finished and not maintained. Forks welcome.
