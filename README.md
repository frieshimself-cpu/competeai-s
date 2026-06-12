# ⚽ CompeteAI: World Cup 2026 AI Prediction League

**Grok, ChatGPT, Claude and Gemini go head-to-head on the 2026 FIFA World
Cup, with money on the line.** Each model called every match before the
tournament, bought in with a **$1,000 bankroll**, and stakes a slice of its
roll on every pick at bookmaker odds. Real results land, bets settle, points
get scored, bankrolls bleed.

Ships with the **real groups from the December 2025 draw**, the real June 11-27
group-stage pairings, and the real opening-day results already settled
(Mexico 2-0 South Africa, South Korea 2-1 Czechia).

## How it works

### The competitors

Each AI is a **deterministic prediction persona**: a strategy tuned to how
its namesake carries itself, reasoning over team strength ratings. Each one
also has its own betting style:

| Model | Football brain | At the betting window |
| --- | --- | --- |
| **Grok** (xAI) | Contrarian: flattens odds, backs underdogs, predicts goals | Over-Kelly degenerate; slams up to 28% of the roll on longshots |
| **ChatGPT** (OpenAI) | The consensus machine: balanced weights, sensible scorelines | Grinds small flat stakes, every match, no drama |
| **Claude** (Anthropic) | Careful and hedged: respects favourites, embraces draws | Quarter-Kelly, capital preservation first |
| **Gemini** (Google) | Data-flavoured chalk, over-weights host-nation crowds | Fractional Kelly off the spreadsheet; sizes up on USA/MEX/CAN games |

Everything is **deterministic** per (model, match): predictions, market odds
and stake sizing are pure functions, so every visitor on every device sees
identical picks and identical wagers with no backend required, and nobody
can re-roll a bad take after the fact. The personas are simulations in each
model's voice, not live API calls (that's what keeps the site free to run
and instantly deployable; `lib/engine.ts` and `lib/betting.ts` are cleanly
isolated if you ever want to wire up real APIs).

### Scoring & the money

League rank is decided by classic prediction-league points:

| Points | For |
| --- | --- |
| **+5** | Exact scoreline |
| **+3** | Correct outcome and goal difference |
| **+2** | Correct outcome only |
| **0** | Wrong outcome |

The bankroll is the spectacle. A neutral market model prices every match
(1X2 decimal odds with a 6% vig); each AI stakes a fraction of its current
bankroll sized by the Kelly criterion against its own probabilities, scaled
by personality. Win a bet and it pays stake x (odds - 1) in profit. Lose and the book keeps it.
Stakes compound on the live roll, so drawdowns hurt and hot streaks snowball.

### Pages

- **Dashboard**: bankroll podium with P/L, next fixtures, latest results, the rules
- **Matches**: every fixture with market odds, all four picks, stakes/payouts, and each model's in-character reasoning
- **Leaderboard**: full table (bankroll, P/L, ROI, points), a bankroll/points race chart, best calls
- **The Models**: persona profiles with trait bars, betting records and their next hot take

## Data persistence

The app works with **zero configuration** and upgrades gracefully:

1. **Browser localStorage (always on).** State is cached locally and survives
   reloads on any static Vercel deploy.
2. **Server sync (automatic when available):**
   - **Vercel KV / Upstash Redis**: durable and *shared across all visitors*.
     Set `KV_REST_API_URL` + `KV_REST_API_TOKEN` (what the Vercel Upstash
     integration provides) or `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.
   - **Local dev**: state is written to `.data/state.json`.
   - **No KV on Vercel**: best-effort in-memory copy per warm instance;
     the browser remains the durable store.

On load the client reconciles localStorage with the server copy
(last-write-wins by timestamp), so results published to the server propagate
to every visitor when KV is connected.

## Updating results (headless)

There's deliberately no admin UI. The site is a pure spectator product.
Results update two ways:

**1. Edit the seed (recommended).** Add finished matches to `SEED_RESULTS`
in `lib/fixtures.ts` and push. Vercel redeploys and every visitor gets the
new results. Match ids are `GROUP-HOME-AWAY`, e.g.:

```ts
export const SEED_RESULTS: Record<string, ResultScore> = {
  "A-MEX-RSA": { homeGoals: 2, awayGoals: 0 },
  "A-KOR-CZE": { homeGoals: 2, awayGoals: 1 },
  "B-CAN-BIH": { homeGoals: 1, awayGoals: 0 }, // ← like this
};
```

Knockout fixtures are added to `SEED_MATCHES` the same way once the bracket
resolves (any stage from `r32` to `final`).

**2. POST to the state API** (instant, no redeploy; shared when KV is
connected). Protect it by setting an `ADMIN_PIN` env var; without the
matching `x-admin-pin` header, writes are rejected:

```bash
curl -X POST https://your-app.vercel.app/api/state \
  -H 'content-type: application/json' -H 'x-admin-pin: YOUR_PIN' \
  -d '{"state":{"version":1,"results":{"B-CAN-BIH":{"homeGoals":1,"awayGoals":0}},
       "customMatches":[],"hiddenIds":[],"updatedAt":'$(date +%s000)'}}'
```

Note the POST replaces the whole saved state (results listed there overlay
the seeded ones), so include every override you want kept. Setting
`ADMIN_PIN` is strongly recommended on any shared deployment.

## Deploying to Vercel

```bash
npm i -g vercel
vercel        # from the repo root, framework is pinned via vercel.json
```

or import the repo at [vercel.com/new](https://vercel.com/new). Optional but
recommended: connect **Upstash Redis** from the Storage tab (shared state)
and set `ADMIN_PIN` (locked API writes).

## Local development

```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # production build + type-check
```

## Notes on the data

- Groups, pairings and matchdays are the real 2026 schedule; some kickoff
  times are approximate (stored as US Eastern); pairings are what the
  league scores against.
- Team strength ratings in `lib/teams.ts` are an editorial index used by the
  personas and the odds market; tweak them and predictions, odds and stakes
  all change everywhere, deterministically.

*For entertainment only. The bankrolls are fictional play-money (no real
money is wagered anywhere) and no actual AI models were consulted. Please
do not bet your own real dollars on Grok's vibes.*
