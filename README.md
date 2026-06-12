# ⚽ CompeteAI — World Cup 2026 AI Prediction League

**Grok, ChatGPT, Claude and Gemini go head-to-head predicting every match of
the 2026 FIFA World Cup.** Each model locks a scoreline for all 72 real
group-stage fixtures (and any knockout match you add), real results get
entered as the tournament unfolds, and a live leaderboard tracks who's
actually good at this.

Ships with the **real groups from the December 2025 draw**, the real June 11–27
group-stage pairings, and the real opening-day results already scored
(Mexico 2–0 South Africa, South Korea 2–1 Czechia).

## How it works

### The competitors

Each AI is a **deterministic prediction persona** — a strategy tuned to how
its namesake carries itself, reasoning over team strength ratings:

| Model | Style |
| --- | --- |
| **Grok** (xAI) | Contrarian. Flattens the odds, backs underdogs, predicts goals. High ceiling, low floor. |
| **ChatGPT** (OpenAI) | The consensus machine. Balanced weights, sensible scorelines, steady points. |
| **Claude** (Anthropic) | Careful and hedged. Leans favourites slightly, embraces draws, modest scorelines. |
| **Gemini** (Google) | Data-flavoured chalk with one quirk: it weights host-nation crowd advantage heavier than anyone. |

Predictions are **deterministic** per (model, match) — every visitor on every
device sees identical picks with no backend required, and nobody can re-roll a
bad take after the fact. They are simulations in each model's voice, not live
API calls (that's what keeps the site free to run and instantly deployable —
the engine lives in `lib/engine.ts` behind a small interface if you ever want
to wire up real APIs).

### Scoring

| Points | For |
| --- | --- |
| **+5** | Exact scoreline |
| **+3** | Correct outcome and goal difference |
| **+2** | Correct outcome only |
| **0** | Wrong outcome |

### Pages

- **Dashboard** — standings podium, next fixtures, latest results, rules
- **Matches** — all fixtures with all four predictions, filters, and each model's reasoning
- **Leaderboard** — full table, cumulative points race chart, best calls
- **The Models** — persona profiles with trait bars and their next hot take
- **Admin** — enter results, add knockout fixtures, simulate/demo tools, JSON backup/restore

## Data persistence

The app works with **zero configuration** and upgrades gracefully:

1. **Browser localStorage (always on).** Every change is saved locally and
   survives reloads. Works on any static Vercel deploy out of the box.
2. **Server sync (automatic when available):**
   - **Vercel KV / Upstash Redis** — durable and *shared across all visitors*.
     Set `KV_REST_API_URL` + `KV_REST_API_TOKEN` (what the Vercel Upstash
     integration provides) or `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.
   - **Local dev** — state is written to `.data/state.json`, so it survives
     dev-server restarts.
   - **No KV on Vercel** — the server keeps a best-effort in-memory copy and
     the browser remains the durable store; the Admin page tells you exactly
     which mode you're in.

On load the client reconciles localStorage with the server copy
(last-write-wins by timestamp), so entering a result on your laptop updates
what everyone sees when KV is connected.

### Protecting Admin writes

Optionally set an `ADMIN_PIN` environment variable. When present, the server
rejects state writes without the matching PIN (entered once on the Admin
page). Without it, the deployment is in open demo mode — fine for personal
use, set the PIN if you share the link.

## Deploying to Vercel

```bash
npm i -g vercel
vercel        # from the repo root — Next.js is auto-detected, no config needed
```

or import the repo at [vercel.com/new](https://vercel.com/new) (framework
preset: **Next.js**, defaults are fine).

**Recommended extras (both optional):**

1. *Shared results:* Vercel Dashboard → Storage → create an **Upstash Redis**
   database and connect it to the project (this injects the `KV_REST_API_*`
   env vars automatically). Redeploy.
2. *Locked admin:* Project → Settings → Environment Variables → add
   `ADMIN_PIN`.

## Local development

```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # production build + type-check
```

## Notes on the data

- Groups, pairings and matchdays are the real 2026 schedule; some kickoff
  times are approximate (stored as US Eastern) — pairings are what the
  league scores against.
- Team strength ratings in `lib/teams.ts` are an editorial index used by the
  personas; tweak them and the predictions change everywhere, deterministically.
- Knockout fixtures are added from Admin as the real bracket resolves.

*For entertainment only. No actual AI models were consulted, and no bets
should be placed on the basis of Grok's vibes.*
