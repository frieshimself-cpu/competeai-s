import { Fight, FightResult, ModelId, Prediction } from "./types";
import { MODELS } from "./models";
import { predictionFor } from "./engine";
import { fighter } from "./fighters";
import { chronoIndex } from "./fixtures";

/**
 * Scoring (UFC prediction league):
 *   5 pts — winner + method + round (or winner + decision; a decision has no round)
 *   3 pts — winner + method, wrong round
 *   2 pts — winner only
 *   0 pts — wrong winner
 */
export const POINTS = { exact: 5, method: 3, winner: 2 } as const;

export function pointsFor(p: Prediction, r: FightResult): number {
  if (p.winner !== r.winner) return 0;
  if (p.method !== r.method) return POINTS.winner;
  if (r.method === "DEC") return POINTS.exact; // decisions have no round to miss
  if (p.round === r.round) return POINTS.exact;
  return POINTS.method;
}

export interface ModelStanding {
  model: ModelId;
  points: number;
  exact: number;
  method: number;
  winner: number;
  miss: number;
  scored: number;
  accuracy: number; // % of scored fights with at least the winner right
  last5: number[];
}

export type GetResult = (fightId: string) => FightResult | null;

/** Fights that have a result, in chronological (settlement) order. */
export function scoredFights(fights: Fight[], getResult: GetResult): Fight[] {
  return fights
    .filter((f) => getResult(f.id) !== null)
    .sort((a, b) => chronoIndex(a) - chronoIndex(b));
}

export function computeStandings(fights: Fight[], getResult: GetResult): ModelStanding[] {
  const done = scoredFights(fights, getResult);
  const rows = MODELS.map((meta) => {
    const s: ModelStanding = {
      model: meta.id,
      points: 0,
      exact: 0,
      method: 0,
      winner: 0,
      miss: 0,
      scored: done.length,
      accuracy: 0,
      last5: [],
    };
    const perFight: number[] = [];
    for (const f of done) {
      const r = getResult(f.id)!;
      const pts = pointsFor(predictionFor(f, meta.id), r);
      perFight.push(pts);
      s.points += pts;
      if (pts === POINTS.exact) s.exact++;
      else if (pts === POINTS.method) s.method++;
      else if (pts === POINTS.winner) s.winner++;
      else s.miss++;
    }
    const right = s.exact + s.method + s.winner;
    s.accuracy = done.length ? Math.round((right / done.length) * 100) : 0;
    s.last5 = perFight.slice(-5);
    return s;
  });
  return rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.exact - a.exact ||
      b.accuracy - a.accuracy ||
      a.model.localeCompare(b.model),
  );
}

/** Cumulative points per model across scored fights (for the chart). */
export function cumulativeSeries(
  fights: Fight[],
  getResult: GetResult,
): { fights: Fight[]; series: Record<ModelId, number[]> } {
  const done = scoredFights(fights, getResult);
  const series = {} as Record<ModelId, number[]>;
  for (const meta of MODELS) {
    let total = 0;
    series[meta.id] = done.map((f) => {
      total += pointsFor(predictionFor(f, meta.id), getResult(f.id)!);
      return total;
    });
  }
  return { fights: done, series };
}

export interface BestCall {
  model: ModelId;
  fight: Fight;
  prediction: Prediction;
  result: FightResult;
  points: number;
  upset: boolean; // picked fighter was the lower-rated side
}

export function bestCalls(fights: Fight[], getResult: GetResult, limit = 4): BestCall[] {
  const calls: BestCall[] = [];
  for (const f of scoredFights(fights, getResult)) {
    const r = getResult(f.id)!;
    for (const meta of MODELS) {
      const p = predictionFor(f, meta.id);
      const pts = pointsFor(p, r);
      if (pts === 0) continue;
      const winCode = p.winner === "R" ? f.red : f.blue;
      const loseCode = p.winner === "R" ? f.blue : f.red;
      const upset = fighter(winCode).rating < fighter(loseCode).rating;
      calls.push({ model: meta.id, fight: f, prediction: p, result: r, points: pts, upset });
    }
  }
  return calls
    .sort((a, b) => b.points - a.points || Number(b.upset) - Number(a.upset))
    .slice(0, limit);
}
