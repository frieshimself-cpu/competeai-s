import { Match, ModelId, Outcome, ResultScore, outcomeOf } from "./types";
import { MODELS } from "./models";
import { NEUTRAL_PERSONALITY, predictionFor, probabilitiesFor, probabilitiesWith } from "./engine";

/**
 * The money layer. Every model starts the tournament with a $1,000 bankroll
 * and must put a stake on its pick for every match, at bookmaker odds derived
 * from a neutral "market" view (with a 6% vig, because the house always wins).
 *
 * Stakes are fractional-Kelly sized from each model's OWN probability versus
 * the market price, scaled by its personality — so Grok piles onto longshots
 * it believes in while ChatGPT grinds out minimum stakes. Settled in kickoff
 * order; stakes compound on the current roll. Fully deterministic, like the
 * predictions themselves.
 */

export const START_BANKROLL = 1000;
const VIG = 0.06;

export interface MatchOdds {
  H: number;
  D: number;
  A: number;
}

const oddsCache = new Map<string, MatchOdds>();

/** Bookmaker decimal odds for a match (same for every model). */
export function marketOdds(match: Match): MatchOdds {
  const hit = oddsCache.get(match.id);
  if (hit) return hit;
  const { pH, pD, pA } = probabilitiesWith(match, NEUTRAL_PERSONALITY);
  // Floor and cap like a real book — nobody prices a World Cup match at 50/1.
  const price = (p: number) =>
    Math.min(26, Math.max(1.05, Math.round((1 / p) * (1 - VIG) * 100) / 100));
  const odds = { H: price(pH), D: price(pD), A: price(pA) };
  oddsCache.set(match.id, odds);
  return odds;
}

export interface Bet {
  matchId: string;
  model: ModelId;
  pick: Outcome;
  odds: number;
  stake: number;
  toWin: number; // profit if it lands
  rollFrac: number; // stake as fraction of bankroll when placed
  status: "pending" | "won" | "lost";
  profit: number; // 0 while pending
}

export interface Wallet {
  model: ModelId;
  bankroll: number;
  profit: number; // bankroll - START
  staked: number; // total settled stakes
  settled: number;
  wins: number;
  roi: number; // % on settled stakes
  biggestWin: Bet | null;
  biggestLoss: Bet | null;
}

export interface BettingBook {
  walletOf: Record<ModelId, Wallet>;
  bets: Map<string, Bet>; // `${model}|${matchId}`
  settledMatches: Match[]; // kickoff order
  bankrollSeries: Record<ModelId, number[]>; // one point per settled match
  totalStaked: number; // settled money across all models
}

export function betFor(book: BettingBook, matchId: string, model: ModelId): Bet | null {
  return book.bets.get(`${model}|${matchId}`) ?? null;
}

const round2 = (v: number) => Math.round(v * 100) / 100;

export function computeBook(
  matches: Match[],
  getResult: (id: string) => ResultScore | null,
): BettingBook {
  const sorted = [...matches].sort(
    (a, b) => a.kickoff.localeCompare(b.kickoff) || a.id.localeCompare(b.id),
  );

  const walletOf = {} as Record<ModelId, Wallet>;
  const bankrollSeries = {} as Record<ModelId, number[]>;
  for (const meta of MODELS) {
    walletOf[meta.id] = {
      model: meta.id,
      bankroll: START_BANKROLL,
      profit: 0,
      staked: 0,
      settled: 0,
      wins: 0,
      roi: 0,
      biggestWin: null,
      biggestLoss: null,
    };
    bankrollSeries[meta.id] = [];
  }

  const bets = new Map<string, Bet>();
  const settledMatches: Match[] = [];
  let totalStaked = 0;

  for (const m of sorted) {
    const result = getResult(m.id);
    const odds = marketOdds(m);

    for (const meta of MODELS) {
      const wallet = walletOf[meta.id];
      const pred = predictionFor(m, meta.id);
      const probs = probabilitiesFor(m, meta.id);
      const p = pred.outcome === "H" ? probs.pH : pred.outcome === "D" ? probs.pD : probs.pA;
      const price = odds[pred.outcome];
      const b = price - 1;

      // Fractional Kelly against the market price, floored so every model
      // always has skin in the game.
      const kelly = Math.max(0, (b * p - (1 - p)) / b);
      const style = meta.betting;
      const frac = Math.min(style.maxFrac, Math.max(style.minFrac, kelly * style.kelly));

      const roll = wallet.bankroll;
      let stake = roll * frac;
      stake = roll >= 100 ? Math.round(stake / 5) * 5 : Math.round(stake);
      stake = Math.max(roll >= 1 ? 1 : 0, Math.min(stake, Math.floor(roll)));
      if (stake <= 0) continue; // effectively bust — sits this one out

      const bet: Bet = {
        matchId: m.id,
        model: meta.id,
        pick: pred.outcome,
        odds: price,
        stake,
        toWin: round2(stake * b),
        rollFrac: frac,
        status: "pending",
        profit: 0,
      };

      if (result) {
        const won = outcomeOf(result.homeGoals, result.awayGoals) === pred.outcome;
        bet.status = won ? "won" : "lost";
        bet.profit = won ? round2(stake * b) : -stake;
        wallet.bankroll = round2(wallet.bankroll + bet.profit);
        wallet.staked += stake;
        wallet.settled++;
        if (won) wallet.wins++;
        totalStaked += stake;
        if (won && (!wallet.biggestWin || bet.profit > wallet.biggestWin.profit)) {
          wallet.biggestWin = bet;
        }
        if (!won && (!wallet.biggestLoss || bet.profit < wallet.biggestLoss.profit)) {
          wallet.biggestLoss = bet;
        }
      }

      bets.set(`${meta.id}|${m.id}`, bet);
    }

    if (result) {
      settledMatches.push(m);
      for (const meta of MODELS) {
        bankrollSeries[meta.id].push(round2(walletOf[meta.id].bankroll));
      }
    }
  }

  for (const meta of MODELS) {
    const w = walletOf[meta.id];
    w.profit = round2(w.bankroll - START_BANKROLL);
    w.roi = w.staked > 0 ? Math.round((w.profit / w.staked) * 100) : 0;
  }

  return { walletOf, bets, settledMatches, bankrollSeries, totalStaked };
}

/** "$1,234", "+$92", "−$140" */
export function fmtMoney(v: number, withSign = false): string {
  const n = Math.round(Math.abs(v));
  const body = `$${n.toLocaleString("en-US")}`;
  if (v < 0) return `−${body}`;
  return withSign && v > 0 ? `+${body}` : body;
}

export function pickLabel(match: Match, pick: Outcome, nameOf: (code: string) => string): string {
  if (pick === "D") return "the draw";
  return nameOf(pick === "H" ? match.home : match.away);
}
