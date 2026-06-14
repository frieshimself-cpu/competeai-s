# 🥊 AI Fight League: UFC AI Prediction League

**Grok, ChatGPT, Claude and Gemini go head-to-head predicting UFC fights, with
money on the line.** For every bout on the card each model calls a **winner,
method and round**, bought in with a **$1,000 bankroll**, and stakes a slice of
its roll on each pick at the moneyline. Real results land, bets settle, points
get scored, bankrolls bleed.

Ships set on the historic **UFC at the White House** card (Topuria vs.
Gaethje, June 14). The event hasn't been fought yet, so every model starts
even: all four sit on their **$1,000 buy-in**, every pick is locked and every
wager is pending. Nothing is scored until you enter the real results (see
below), at which point the leaderboard, bankrolls and charts come alive.

## How it works

### The competitors

Each AI is a **deterministic prediction persona**: a strategy tuned to how its
namesake carries itself, reasoning over fighter ratings, finish rates and the
tale of the tape. Each one also has its own betting style:

| Model | Fight brain | At the betting window |
| --- | --- | --- |
| **Grok** (xAI) | Contrarian: hunts live underdogs and highlight-reel KOs | Over-Kelly degenerate; slams up to 28% of the roll on a juicy dog |
| **ChatGPT** (OpenAI) | The consensus machine: leans favourites and the scorecards | Flat, disciplined units, every fight, no chasing |
| **Claude** (Anthropic) | Cautious: respects champions, expects decisions in close fights | Quarter-Kelly, capital-preservation first |
| **Gemini** (Google) | Data-flavoured chalk; over-weights title-fight pedigree | Fractional Kelly off the spreadsheet; sizes up when a belt is on the line |

Everything is **deterministic** per (model, fight): the pick, the moneyline and
the stake are pure functions, so every visitor on every device sees identical
predictions and wagers with no backend required, and nobody can re-roll a bad
take after the fact. The personas are simulations in each model's voice, not
live API calls (that's what keeps the site free to run and instantly
deployable; `lib/engine.ts` and `lib/betting.ts` are cleanly isolated if you
ever want to wire up real APIs).

### Scoring & the money

League rank is decided by prediction-league points:

| Points | For |
| --- | --- |
| **+5** | Perfect call: right fighter, right method, right round |
| **+3** | Right fighter and method, wrong round |
| **+2** | Right fighter only |
| **0** | Wrong fighter |

(A decision has no round, so calling the winner *and* a decision is a perfect +5.)

The bankroll is the spectacle. A neutral market model prices every fight as a
moneyline (decimal odds with a 6% vig, shown American-style like `-450` /
`+320`); each AI stakes a fraction of its current bankroll sized by the Kelly
criterion against its own win probability, scaled by personality. Win the bet
and it pays stake × (odds − 1); lose and the book keeps it. Stakes compound on
the live roll, so a cold card hurts and a hot one snowballs.

### Pages

- **Dashboard**: bankroll podium with P/L, the next card, latest results, the rules
- **Fights**: every bout with the moneyline, all four picks (winner/method/round), stakes/payouts, and each model's breakdown
- **Leaderboard**: full table (bankroll, P/L, ROI, points, perfect/method/winner), a bankroll/points race chart, best calls
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

**1. Edit the seed (recommended).** Add finished fights to `SEED_RESULTS`
in `lib/fixtures.ts` and push. Vercel redeploys and every visitor gets the
new results. Fight ids are `EVENT-RED-BLUE`; `winner` is `R` (red) or `B`
(blue), `round` is `0` for a decision:

```ts
export const SEED_RESULTS: Record<string, FightResult> = {
  "fn-BELAL-BONFIM": { winner: "B", method: "DEC", round: 0 },
  "wh-TOPURIA-GAETHJE": { winner: "R", method: "KO", round: 3 }, // ← like this
};
```

Add the next card's bouts to `SEED_FIGHTS` (and any new fighters to
`lib/fighters.ts`) the same way.

**2. POST to the state API** (instant, no redeploy; shared when KV is
connected). Protect it by setting an `ADMIN_PIN` env var; without the
matching `x-admin-pin` header, writes are rejected:

```bash
curl -X POST https://your-app.vercel.app/api/state \
  -H 'content-type: application/json' -H 'x-admin-pin: YOUR_PIN' \
  -d '{"state":{"version":1,"results":{"wh-TOPURIA-GAETHJE":{"winner":"R","method":"KO","round":3}},
       "customFights":[],"hiddenIds":[],"updatedAt":'$(date +%s000)'}}'
```

The POST replaces the whole saved state (results listed there overlay the
seeded ones), so include every override you want kept. Setting `ADMIN_PIN`
is strongly recommended on any shared deployment.

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

- Pairings and weight classes are taken from the announced White House card;
  fighter ratings, records and `ko` (knockout vs
  submission lean) in `lib/fighters.ts` are an editorial index used by the
  prediction engines and the odds market. Tweak them and predictions, odds and
  stakes all change everywhere, deterministically.

*For entertainment only. The bankrolls are fictional play-money (no real money
is wagered anywhere) and no actual AI models were consulted. Please do not bet
your own real dollars on Grok's vibes.*
