import { Match, ModelId, Prediction, ResultScore, outcomeOf } from "./types";
import { MODELS } from "./models";
import { predictionFor } from "./engine";
import { team } from "./teams";

/**
 * Scoring (classic prediction-league rules):
 *   5 pts — exact scoreline
 *   3 pts — correct outcome AND goal difference (e.g. predicted 2–1, result 3–2)
 *   2 pts — correct outcome only
 *   0 pts — wrong outcome
 */
export const POINTS = { exact: 5, gd: 3, outcome: 2 } as const;

export function pointsFor(p: Prediction, r: ResultScore): number {
  if (p.homeGoals === r.homeGoals && p.awayGoals === r.awayGoals) return POINTS.exact;
  if (p.outcome !== outcomeOf(r.homeGoals, r.awayGoals)) return 0;
  if (p.homeGoals - p.awayGoals === r.homeGoals - r.awayGoals) return POINTS.gd;
  return POINTS.outcome;
}

export interface ModelStanding {
  model: ModelId;
  points: number;
  exact: number;
  gd: number;
  outcome: number;
  miss: number;
  scored: number; // matches with a result
  accuracy: number; // % of scored matches with at least the outcome right
  last5: number[]; // points from the 5 most recent scored matches
}

export type GetResult = (matchId: string) => ResultScore | null;

/** Matches that have a result, in kickoff order. */
export function scoredMatches(matches: Match[], getResult: GetResult): Match[] {
  return matches
    .filter((m) => getResult(m.id) !== null)
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff));
}

export function computeStandings(matches: Match[], getResult: GetResult): ModelStanding[] {
  const done = scoredMatches(matches, getResult);
  const rows = MODELS.map((meta) => {
    const s: ModelStanding = {
      model: meta.id,
      points: 0,
      exact: 0,
      gd: 0,
      outcome: 0,
      miss: 0,
      scored: done.length,
      accuracy: 0,
      last5: [],
    };
    const perMatch: number[] = [];
    for (const m of done) {
      const r = getResult(m.id)!;
      const pts = pointsFor(predictionFor(m, meta.id), r);
      perMatch.push(pts);
      s.points += pts;
      if (pts === POINTS.exact) s.exact++;
      else if (pts === POINTS.gd) s.gd++;
      else if (pts === POINTS.outcome) s.outcome++;
      else s.miss++;
    }
    const right = s.exact + s.gd + s.outcome;
    s.accuracy = done.length ? Math.round((right / done.length) * 100) : 0;
    s.last5 = perMatch.slice(-5);
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

/** Cumulative points per model across scored matches (for the chart). */
export function cumulativeSeries(
  matches: Match[],
  getResult: GetResult,
): { matches: Match[]; series: Record<ModelId, number[]> } {
  const done = scoredMatches(matches, getResult);
  const series = {} as Record<ModelId, number[]>;
  for (const meta of MODELS) {
    let total = 0;
    series[meta.id] = done.map((m) => {
      total += pointsFor(predictionFor(m, meta.id), getResult(m.id)!);
      return total;
    });
  }
  return { matches: done, series };
}

export interface BestCall {
  model: ModelId;
  match: Match;
  prediction: Prediction;
  result: ResultScore;
  points: number;
  upset: boolean; // picked winner was the lower-rated side
}

export function bestCalls(matches: Match[], getResult: GetResult, limit = 4): BestCall[] {
  const calls: BestCall[] = [];
  for (const m of scoredMatches(matches, getResult)) {
    const r = getResult(m.id)!;
    for (const meta of MODELS) {
      const p = predictionFor(m, meta.id);
      const pts = pointsFor(p, r);
      if (pts === 0) continue;
      const winner = p.outcome === "H" ? m.home : p.outcome === "A" ? m.away : null;
      const loser = p.outcome === "H" ? m.away : p.outcome === "A" ? m.home : null;
      const upset =
        !!winner && !!loser && team(winner).rating < team(loser).rating;
      calls.push({ model: meta.id, match: m, prediction: p, result: r, points: pts, upset });
    }
  }
  return calls
    .sort((a, b) => b.points - a.points || Number(b.upset) - Number(a.upset))
    .slice(0, limit);
}
