import { Match, ModelId, Outcome, Prediction } from "./types";
import { HOSTS, team } from "./teams";
import { MODEL_MAP, Personality } from "./models";

/* ──────────────────────────────────────────────────────────────
 * Deterministic randomness: every (model, match) pair always
 * produces the same prediction, on every device, with no backend.
 * ────────────────────────────────────────────────────────────── */

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Effective rating incl. host-nation crowd edge, as seen by a given model. */
function effRating(code: string, hostEdge: number): number {
  return team(code).rating + (HOSTS.has(code) ? 3.5 * hostEdge : 0);
}

export interface OutcomeProbs {
  pH: number;
  pD: number;
  pA: number;
  diff: number; // effective rating gap (home - away)
}

/** A personality with no biases — used as the bookmaker's "market" view. */
export const NEUTRAL_PERSONALITY: Personality = {
  upset: 1,
  drawBias: 1,
  goals: 1,
  hostEdge: 1,
  confShift: 0,
};

export function probabilitiesWith(match: Match, p: Personality): OutcomeProbs {
  const diff = effRating(match.home, p.hostEdge) - effRating(match.away, p.hostEdge);

  // Elo-flavoured win expectancy, flattened by the model's upset appetite.
  let homeShare = 1 / (1 + Math.pow(10, -diff / 16));
  homeShare = 0.5 + (homeShare - 0.5) / p.upset;

  const pD = clamp((0.27 - Math.abs(diff) * 0.005) * p.drawBias, 0.07, 0.34);
  const pH = homeShare * (1 - pD);
  const pA = (1 - homeShare) * (1 - pD);
  return { pH, pD, pA, diff };
}

export function probabilitiesFor(match: Match, model: ModelId): OutcomeProbs {
  return probabilitiesWith(match, MODEL_MAP[model].p);
}

function pickWeighted(rng: () => number, weights: [number, number][]): number {
  const total = weights.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [value, w] of weights) {
    r -= w;
    if (r <= 0) return value;
  }
  return weights[weights.length - 1][0];
}

/* ──────────────────────────────────────────────────────────────
 * Reasoning generators — each model has its own voice.
 * ────────────────────────────────────────────────────────────── */

interface Ctx {
  home: string;
  away: string;
  fav: string;
  dog: string;
  pick: string; // picked team name, or "a draw"
  score: string;
  gap: string;
  conf: number;
}

type Tpl = (c: Ctx) => string;

const GROK_LINES: Tpl[] = [
  (c) => `Everyone's mainlining the ${c.fav} hype. Meanwhile ${c.pick} takes it ${c.score}. You heard it here first.`,
  (c) => `The "experts" have spreadsheets. I have vibes and the vibes say ${c.pick}, ${c.score}. Spreadsheets hate this one trick.`,
  (c) => `${c.home} vs ${c.away} is ${c.gap} on paper. Paper is for losers. ${c.score}. Next question.`,
  (c) => `Hot take incoming: ${c.pick} ${c.score}. If I'm wrong, I was being ironic. If I'm right, frame this.`,
  (c) => `${c.dog} at these odds is free money — not financial advice, except it is. Calling ${c.score}.`,
  (c) => `My training data says ${c.fav}. My soul says ${c.score}. Soul wins, it always does.`,
  (c) => `Group-stage chaos is undefeated and so am I (citation needed). ${c.pick}, ${c.score}, book it.`,
];

const CHATGPT_LINES: Tpl[] = [
  (c) => `Weighing recent form, squad depth and tournament pedigree, ${c.pick} should edge this ${c.score}. The gap between these sides is ${c.gap}, so I'd treat it as a lean rather than a lock.`,
  (c) => `On balance ${c.pick} looks the sensible call at ${c.score}. ${c.fav} carry the stronger overall profile, though World Cup margins are famously thin.`,
  (c) => `Several factors point the same way here — ${c.fav}'s depth chart chief among them. I'll say ${c.score}, with about ${c.conf}% conviction.`,
  (c) => `A balanced read: ${c.home} bring structure, ${c.away} bring counter-threat. Synthesising both, ${c.pick} ${c.score} is where the evidence lands.`,
  (c) => `This is ${c.gap}, and my projection lands on ${c.pick} at ${c.score}. Happy to be wrong — that's what post-match analysis is for.`,
  (c) => `Consensus isn't a dirty word when it's usually right. ${c.pick}, ${c.score}, and a respectful nod to the losing dressing room.`,
];

const CLAUDE_LINES: Tpl[] = [
  (c) => `I weighed ${c.home}'s pressing structure against ${c.away}'s transition threat. The gap is ${c.gap}, so I'll say ${c.pick} ${c.score} — though I hold this loosely.`,
  (c) => `I considered a draw seriously here. The honest answer is the uncertainty is high, but on reflection ${c.pick} ${c.score} is my best estimate.`,
  (c) => `Tournament football compresses quality gaps, which gives me pause. Still, careful reasoning points to ${c.pick} at ${c.score}. Confidence: ${c.conf}%, and I mean that literally.`,
  (c) => `There are good arguments for both sides, and I want to represent them fairly. Having done so: ${c.pick}, ${c.score}, with appropriate epistemic humility.`,
  (c) => `${c.fav} are stronger on most dimensions I can verify, but ${c.dog} have a credible path through set pieces. Net of everything, ${c.score}.`,
  (c) => `I'd rather be calibrated than exciting. ${c.pick} ${c.score} — a modest scoreline, because most football matches have modest scorelines.`,
];

const GEMINI_LINES: Tpl[] = [
  (c) => `I ran 10,000 simulations and ${c.pick} prevails in ${c.conf}% of them. The expected-goals model converges on ${c.score}. The data has spoken.`,
  (c) => `Cross-referencing form curves, travel fatigue and venue effects: ${c.pick} ${c.score}. Methodology available on request.`,
  (c) => `My priors said ${c.fav}; my regression agreed. That happens less often than you'd think. ${c.score}.`,
  (c) => `Adjusting for crowd amplitude — a variable my colleagues persistently undervalue — the projection is ${c.pick} at ${c.score}.`,
  (c) => `The matchup matrix rates this ${c.gap}. Monte Carlo says ${c.score}, and I don't argue with Monte Carlo.`,
  (c) => `Signal over noise: ${c.dog}'s underlying numbers are better than their reputation, but not by enough. ${c.pick} ${c.score}.`,
];

const LINES: Record<ModelId, Tpl[]> = {
  grok: GROK_LINES,
  chatgpt: CHATGPT_LINES,
  claude: CLAUDE_LINES,
  gemini: GEMINI_LINES,
};

function gapWord(diff: number): string {
  const d = Math.abs(diff);
  if (d < 3) return "a genuine coin-flip";
  if (d < 7) return "tight";
  if (d < 13) return "clear but not safe";
  return "lopsided";
}

/* ──────────────────────────────────────────────────────────────
 * The prediction itself
 * ────────────────────────────────────────────────────────────── */

const cache = new Map<string, Prediction>();

export function predictionFor(match: Match, model: ModelId): Prediction {
  const key = `${model}|${match.id}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const meta = MODEL_MAP[model];
  const rng = mulberry32(hashString(key));
  const { pH, pD, pA, diff } = probabilitiesFor(match, model);

  const r = rng();
  const outcome: Outcome = r < pH ? "H" : r < pH + pD ? "D" : "A";

  let homeGoals: number;
  let awayGoals: number;
  const g = meta.p.goals;

  if (outcome === "D") {
    const score = pickWeighted(rng, [
      [0, 0.2 / g],
      [1, 0.46],
      [2, 0.28 * g],
      [3, 0.06 * g],
    ]);
    homeGoals = awayGoals = score;
  } else {
    const edge = Math.abs(diff);
    let margin = 1;
    if (rng() < clamp(0.16 + edge * 0.014, 0.12, 0.5) * g) margin++;
    if (rng() < clamp(0.05 + edge * 0.006, 0.04, 0.22) * g) margin++;
    const loser = pickWeighted(rng, [
      [0, 0.5 / g],
      [1, 0.38],
      [2, 0.12 * g],
    ]);
    const winner = Math.min(loser + margin, 5);
    homeGoals = outcome === "H" ? winner : loser;
    awayGoals = outcome === "H" ? loser : winner;
  }

  const pPick = outcome === "H" ? pH : outcome === "D" ? pD : pA;
  const confidence = Math.round(clamp(pPick * 100 + meta.p.confShift, 32, 93));

  const home = team(match.home);
  const away = team(match.away);
  const favTeam = home.rating >= away.rating ? home : away;
  const dogTeam = favTeam === home ? away : home;
  const pickName =
    outcome === "D" ? "a draw" : outcome === "H" ? home.name : away.name;
  const ctx: Ctx = {
    home: home.name,
    away: away.name,
    fav: favTeam.name,
    dog: dogTeam.name,
    pick: pickName,
    score: `${homeGoals}–${awayGoals}`,
    gap: gapWord(diff),
    conf: confidence,
  };

  const lines = LINES[model];
  const reasoning = lines[Math.floor(rng() * lines.length)](ctx);

  const prediction: Prediction = {
    matchId: match.id,
    model,
    homeGoals,
    awayGoals,
    outcome,
    confidence,
    reasoning,
  };
  cache.set(key, prediction);
  return prediction;
}

/** Simulate a plausible real result (used by the Admin demo tools). */
export function simulateResult(match: Match): { homeGoals: number; awayGoals: number } {
  const rng = mulberry32(hashString(`sim|${match.id}|${Date.now()}|${Math.random()}`));
  const diff = effRating(match.home, 1) - effRating(match.away, 1);
  const homeShare = 1 / (1 + Math.pow(10, -diff / 16));
  const pD = clamp(0.27 - Math.abs(diff) * 0.005, 0.07, 0.34);
  const r = rng();
  const outcome: Outcome = r < homeShare * (1 - pD) ? "H" : r < homeShare * (1 - pD) + pD ? "D" : "A";
  if (outcome === "D") {
    const s = pickWeighted(rng, [[0, 0.22], [1, 0.46], [2, 0.26], [3, 0.06]]);
    return { homeGoals: s, awayGoals: s };
  }
  let margin = 1;
  if (rng() < clamp(0.16 + Math.abs(diff) * 0.014, 0.12, 0.5)) margin++;
  if (rng() < clamp(0.05 + Math.abs(diff) * 0.006, 0.04, 0.22)) margin++;
  const loser = pickWeighted(rng, [[0, 0.5], [1, 0.38], [2, 0.12]]);
  const winner = Math.min(loser + margin, 6);
  return outcome === "H"
    ? { homeGoals: winner, awayGoals: loser }
    : { homeGoals: loser, awayGoals: winner };
}
