---
name: testing-run-it-away
description: How to run and test the Run It Away Next.js app locally, including demo mode without a database and how to get a real ~390px mobile viewport in Chrome on this box.
---

# Testing Run It Away

## Running the app
- No auth, no database provisioning required. With `DATABASE_URL` unset the app uses an in-memory
  repository seeded with 3 engineering problems (`lib/db/index.ts` picks the repo based on
  `process.env.DATABASE_URL`).
- Start: `cd <repo> && env -u DATABASE_URL npm run dev` (Next 14 dev server on :3000).
  Use `env -u DATABASE_URL` explicitly — a `DATABASE_URL` inherited from the shell/session
  silently switches the app to Neon and testing will fail on network/auth.
- The in-memory store is module state: **restarting the dev server wipes user-created problems and
  resets to the 3 seeds.** This is a handy way to get clean screenshots, not a bug to report.
- Server actions redirect with query flags: `/?saved=1` (green confirmation banner) and
  `/?error=title` (inline "Give the problem a title first."). These are useful assertion hooks.

## Mobile-first testing (~390px viewport)
Chrome on this box refuses to shrink below ~532 px of window width, so window resizing alone
cannot reach a 390 px viewport. Use window width + zoom instead of DevTools device emulation:
1. `wmctrl -r :ACTIVE: -b remove,maximized_vert,maximized_horz`
2. `xdotool getactivewindow windowsize 620 1180` (real pixels; check `xrandr` — the screenshot
   coordinate space may be scaled down from the real resolution, e.g. 1600x1200 -> 1024x768)
3. Focus the page and press `ctrl+equal` three times (100% -> 150% zoom).
4. Verify with `window.innerWidth` in the console — this yields ~392x701 CSS px.
Reset with `ctrl+0` and re-maximize for the desktop sanity pass.

## Typing adversarial input
- `xdotool type` (the computer-use `type` action) silently drops emoji and CJK characters.
  For unicode/emoji, long, or multi-line/large pastes, install `xclip`
  (`sudo apt-get install -y xclip`) and load the clipboard from a file:
  `DISPLAY=:0 xclip -selection clipboard -i /tmp/payload.txt`, then `ctrl+v` in the field.
- The title input has HTML `required`, so an empty submit is blocked client-side. To exercise the
  server-side validation branch, submit a **whitespace-only** title (passes `required`, fails the
  server `trim()`).

## Known rough edges (may still be present)
- Long unbroken titles overflow the problem card and the hub `h1` (no `break-words`), clipping text,
  pushing the status badge out of view and adding page-level horizontal scroll. Check this whenever
  touching card/heading styles.
- The capture form is uncontrolled and is not cleared after a successful save, so the previous dump
  stays in the fields (double-submit risk).
- Session transcripts render via `JSON.stringify`, so seeded notes show as raw JSON.
