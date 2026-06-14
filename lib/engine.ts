import { Corner, Fight, FightResult, Method, METHOD_WORD, ModelId, Prediction } from "./types";
import { fighter } from "./fighters";
import { MODEL_MAP, Personality } from "./models";

/* ──────────────────────────────────────────────────────────────
 * Deterministic randomness: every (model, fight) pair always
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

export const NEUTRAL_PERSONALITY: Personality = {
  upset: 1,
  decisionBias: 1,
  finishLust: 1,
  favReverence: 1,
  confShift: 0,
};

/** Rating as seen by a given persona (champions/favourites get a reverence bump). */
function effRating(code: string, isFav: boolean, favReverence: number): number {
  return fighter(code).rating + (isFav ? (favReverence - 1) * 6 : 0);
}

export interface OutcomeProbs {
  pRed: number;
  pBlue: number;
  diff: number; // effective rating gap (red - blue)
}

export function probabilitiesWith(fight: Fight, p: Personality): OutcomeProbs {
  const rRed = fighter(fight.red).rating;
  const rBlue = fighter(fight.blue).rating;
  const redFav = rRed >= rBlue;
  const eRed = effRating(fight.red, redFav, p.favReverence);
  const eBlue = effRating(fight.blue, !redFav, p.favReverence);
  const diff = eRed - eBlue;

  // Elo-flavoured win expectancy, flattened by the persona's upset appetite.
  let redShare = 1 / (1 + Math.pow(10, -diff / 16));
  redShare = 0.5 + (redShare - 0.5) / p.upset;
  redShare = clamp(redShare, 0.05, 0.95);
  return { pRed: redShare, pBlue: 1 - redShare, diff };
}

export function probabilitiesFor(fight: Fight, model: ModelId): OutcomeProbs {
  return probabilitiesWith(fight, MODEL_MAP[model].p);
}

function pickWeighted(rng: () => number, weights: number[]): number {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

function pickRound(rng: () => number, maxRounds: number, finishLust: number): number {
  // Earlier rounds heavier; finish-hungry personas steepen toward round 1.
  const weights: number[] = [];
  for (let r = 1; r <= maxRounds; r++) weights.push(Math.pow(0.62, r - 1));
  weights[0] *= clamp(finishLust, 0.6, 1.6);
  return pickWeighted(rng, weights) + 1;
}

/* ──────────────────────────────────────────────────────────────
 * Reasoning generators. Each model has its own voice.
 * ────────────────────────────────────────────────────────────── */

interface Ctx {
  red: string;
  blue: string;
  fav: string;
  dog: string;
  pick: string; // picked fighter name
  how: string; // "by KO in round 2" / "by decision"
  weight: string;
  conf: number;
  gap: string;
}

type Tpl = (c: Ctx) => string;

const GROK_LINES: Tpl[] = [
  (c) => `Books love ${c.fav}. I love value. ${c.pick} ${c.how}, screenshot it.`,
  (c) => `${c.dog} is live and everyone's asleep on it. ${c.pick} ${c.how}. Easy.`,
  (c) => `Tale of the tape is for cowards. ${c.pick} ${c.how} and it isn't close.`,
  (c) => `Hot take: ${c.pick} ${c.how}. If I'm wrong I was trolling, if I'm right frame it.`,
  (c) => `${c.fav} has a chin made of fine china. ${c.pick} ${c.how}, book it.`,
  (c) => `This is a ${c.gap} on paper and I'm fading the paper. ${c.pick} ${c.how}.`,
  (c) => `Underdog moneyline + a head kick = free real estate. ${c.pick} ${c.how}.`,
];

const CHATGPT_LINES: Tpl[] = [
  (c) => `Weighing form, output and durability, ${c.pick} is the sensible call ${c.how}. The matchup reads ${c.gap}.`,
  (c) => `On balance ${c.fav} carries the cleaner profile, so ${c.pick} ${c.how}, with roughly ${c.conf}% conviction.`,
  (c) => `Several lanes point the same way at ${c.weight}: ${c.pick} ${c.how} is where the evidence lands.`,
  (c) => `A measured read: ${c.red} vs ${c.blue} is ${c.gap}. I'll take ${c.pick} ${c.how}.`,
  (c) => `Volume and ring IQ favour one side here. ${c.pick} ${c.how}; happy to be wrong, that's MMA.`,
  (c) => `Consensus isn't a dirty word when it's usually right. ${c.pick} ${c.how}.`,
];

const CLAUDE_LINES: Tpl[] = [
  (c) => `I weighed ${c.red}'s pressure against ${c.blue}'s counters. It's ${c.gap}, so ${c.pick} ${c.how}, held loosely.`,
  (c) => `Honestly the variance here is high. On reflection, ${c.pick} ${c.how} is my best estimate, around ${c.conf}%.`,
  (c) => `Championship rounds reward cardio and composure, which tilts me to ${c.pick} ${c.how}. I could see it going the other way.`,
  (c) => `There's a real case for both fighters, and I want to be fair to it. Net of everything: ${c.pick} ${c.how}.`,
  (c) => `${c.fav} is steadier on most axes I can verify, but one clean shot rewrites the night. Still: ${c.pick} ${c.how}.`,
  (c) => `I'd rather be calibrated than loud. ${c.pick} ${c.how}, because that's the likeliest path, not the flashiest.`,
];

const GEMINI_LINES: Tpl[] = [
  (c) => `Ran the tale of the tape 10,000 times; ${c.pick} prevails in ${c.conf}% of them, ${c.how}.`,
  (c) => `Significant-strike differential and takedown defence converge on ${c.pick} ${c.how}. Methodology on request.`,
  (c) => `My priors said ${c.fav}; the model agreed. ${c.pick} ${c.how}.`,
  (c) => `Adjusting for title-fight pedigree (undervalued by my peers), the projection is ${c.pick} ${c.how}.`,
  (c) => `The matchup matrix rates this ${c.gap}. Monte Carlo says ${c.pick} ${c.how}, and I don't argue with it.`,
  (c) => `${c.dog}'s underlying numbers beat their reputation, but not by enough. ${c.pick} ${c.how}.`,
];

const LINES: Record<ModelId, Tpl[]> = {
  grok: GROK_LINES,
  chatgpt: CHATGPT_LINES,
  claude: CLAUDE_LINES,
  gemini: GEMINI_LINES,
};

function gapWord(diff: number): string {
  const d = Math.abs(diff);
  if (d < 3) return "a coin-flip";
  if (d < 8) return "a close one";
  if (d < 16) return "a clear edge";
  return "a mismatch";
}

/** "by KO in round 2" / "by submission in round 1" / "by decision" */
export function describeFinish(method: Method, round: number): string {
  if (method === "DEC") return "by decision";
  return `by ${METHOD_WORD[method]} in round ${round}`;
}

/* ──────────────────────────────────────────────────────────────
 * The prediction itself
 * ────────────────────────────────────────────────────────────── */

const cache = new Map<string, Prediction>();

export function predictionFor(fight: Fight, model: ModelId): Prediction {
  const key = `${model}|${fight.id}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const meta = MODEL_MAP[model];
  const p = meta.p;
  const rng = mulberry32(hashString(key));
  const { pRed, pBlue, diff } = probabilitiesWith(fight, p);

  const winner: Corner = rng() < pRed ? "R" : "B";
  const winnerCode = winner === "R" ? fight.red : fight.blue;

  // Finish probability rises with a bigger skill gap and the persona's appetite.
  let pFinish = (0.46 + Math.abs(diff) * 0.012) * p.finishLust;
  pFinish /= p.decisionBias;
  pFinish = clamp(pFinish, 0.12, 0.85);

  let method: Method;
  let round: number;
  if (rng() < pFinish) {
    method = rng() < fighter(winnerCode).ko ? "KO" : "SUB";
    round = pickRound(rng, fight.rounds, p.finishLust);
  } else {
    method = "DEC";
    round = 0;
  }

  const pPick = winner === "R" ? pRed : pBlue;
  const confidence = Math.round(clamp(pPick * 100 + meta.p.confShift, 32, 93));

  const red = fighter(fight.red);
  const blue = fighter(fight.blue);
  const favF = red.rating >= blue.rating ? red : blue;
  const dogF = favF === red ? blue : red;
  const ctx: Ctx = {
    red: red.name,
    blue: blue.name,
    fav: favF.name,
    dog: dogF.name,
    pick: fighter(winnerCode).name,
    how: describeFinish(method, round),
    weight: fight.weightClass,
    conf: confidence,
    gap: gapWord(diff),
  };

  const lines = LINES[model];
  const reasoning = lines[Math.floor(rng() * lines.length)](ctx);

  const prediction: Prediction = {
    fightId: fight.id,
    model,
    winner,
    method,
    round,
    confidence,
    reasoning,
  };
  cache.set(key, prediction);
  return prediction;
}

/** Short label for a pick chip, e.g. "TOP KO R2" or "GAE DEC". */
export function pickShort(fight: Fight, pred: Prediction): string {
  const code = pred.winner === "R" ? fight.red : fight.blue;
  const tail = pred.method === "DEC" ? "DEC" : `${pred.method} R${pred.round}`;
  return `${fighter(code).short} ${tail}`;
}

/** Full sentence describing a prediction, e.g. "Topuria by KO in round 2". */
export function describePrediction(fight: Fight, pred: Prediction): string {
  const code = pred.winner === "R" ? fight.red : fight.blue;
  return `${fighter(code).name} ${describeFinish(pred.method, pred.round)}`;
}

/** Simulate a plausible real result (used by the demo tools). */
export function simulateResult(fight: Fight): FightResult {
  const rng = mulberry32(hashString(`sim|${fight.id}|${Date.now()}|${Math.random()}`));
  const { pRed, diff } = probabilitiesWith(fight, NEUTRAL_PERSONALITY);
  const winner: Corner = rng() < pRed ? "R" : "B";
  const winnerCode = winner === "R" ? fight.red : fight.blue;
  const pFinish = clamp(0.46 + Math.abs(diff) * 0.012, 0.2, 0.8);
  if (rng() < pFinish) {
    const method: Method = rng() < fighter(winnerCode).ko ? "KO" : "SUB";
    return { winner, method, round: pickRound(rng, fight.rounds, 1) };
  }
  return { winner, method: "DEC", round: 0 };
}
