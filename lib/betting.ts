import { Corner, Fight, FightResult, ModelId } from "./types";
import { MODELS } from "./models";
import { NEUTRAL_PERSONALITY, predictionFor, probabilitiesFor, probabilitiesWith } from "./engine";
import { chronoIndex } from "./fixtures";

/**
 * The money layer. Every model starts with a $1,000 bankroll and stakes part
 * of it on its pick to win each fight, at moneyline odds derived from a
 * neutral "market" view (with a 6% vig, because the house always wins).
 *
 * Stakes are fractional-Kelly sized from each model's OWN win probability
 * versus the market price, scaled by its personality, so Grok piles onto
 * underdogs while ChatGPT grinds flat units. Settled in chronological order;
 * stakes compound on the current roll. Fully deterministic.
 */

export const START_BANKROLL = 1000;
const VIG = 0.06;

export interface MatchOdds {
  R: number; // decimal odds, red corner
  B: number; // decimal odds, blue corner
}

const oddsCache = new Map<string, MatchOdds>();

/** Bookmaker decimal odds for a fight (same for every model). */
export function marketOdds(fight: Fight): MatchOdds {
  const hit = oddsCache.get(fight.id);
  if (hit) return hit;
  const { pRed, pBlue } = probabilitiesWith(fight, NEUTRAL_PERSONALITY);
  // Floor and cap like a real book; nobody prices an MMA fight at 50/1.
  const price = (p: number) =>
    Math.min(26, Math.max(1.04, Math.round((1 / p) * (1 - VIG) * 100) / 100));
  const odds = { R: price(pRed), B: price(pBlue) };
  oddsCache.set(fight.id, odds);
  return odds;
}

/** Decimal odds → American moneyline string, e.g. "-450" or "+320". */
export function americanOdds(dec: number): string {
  if (dec >= 2) return `+${Math.round(((dec - 1) * 100) / 5) * 5}`;
  return `-${Math.round((100 / (dec - 1)) / 5) * 5}`;
}

export interface Bet {
  fightId: string;
  model: ModelId;
  pick: Corner;
  odds: number;
  stake: number;
  toWin: number; // profit if it lands
  rollFrac: number;
  status: "pending" | "won" | "lost";
  profit: number;
}

export interface Wallet {
  model: ModelId;
  bankroll: number;
  profit: number;
  staked: number;
  settled: number;
  wins: number;
  roi: number;
  biggestWin: Bet | null;
  biggestLoss: Bet | null;
}

export interface BettingBook {
  walletOf: Record<ModelId, Wallet>;
  bets: Map<string, Bet>; // `${model}|${fightId}`
  settledFights: Fight[];
  bankrollSeries: Record<ModelId, number[]>;
  totalStaked: number;
}

export function betFor(book: BettingBook, fightId: string, model: ModelId): Bet | null {
  return book.bets.get(`${model}|${fightId}`) ?? null;
}

const round2 = (v: number) => Math.round(v * 100) / 100;

export function computeBook(
  fights: Fight[],
  getResult: (id: string) => FightResult | null,
): BettingBook {
  const sorted = [...fights].sort((a, b) => chronoIndex(a) - chronoIndex(b));

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
  const settledFights: Fight[] = [];
  let totalStaked = 0;

  for (const f of sorted) {
    const result = getResult(f.id);
    const odds = marketOdds(f);

    for (const meta of MODELS) {
      const wallet = walletOf[meta.id];
      const pred = predictionFor(f, meta.id);
      const probs = probabilitiesFor(f, meta.id);
      const p = pred.winner === "R" ? probs.pRed : probs.pBlue;
      const price = odds[pred.winner];
      const b = price - 1;

      const kelly = Math.max(0, (b * p - (1 - p)) / b);
      const style = meta.betting;
      const frac = Math.min(style.maxFrac, Math.max(style.minFrac, kelly * style.kelly));

      const roll = wallet.bankroll;
      let stake = roll * frac;
      stake = roll >= 100 ? Math.round(stake / 5) * 5 : Math.round(stake);
      stake = Math.max(roll >= 1 ? 1 : 0, Math.min(stake, Math.floor(roll)));
      if (stake <= 0) continue;

      const bet: Bet = {
        fightId: f.id,
        model: meta.id,
        pick: pred.winner,
        odds: price,
        stake,
        toWin: round2(stake * b),
        rollFrac: frac,
        status: "pending",
        profit: 0,
      };

      if (result) {
        const won = result.winner === pred.winner;
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

      bets.set(`${meta.id}|${f.id}`, bet);
    }

    if (result) {
      settledFights.push(f);
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

  return { walletOf, bets, settledFights, bankrollSeries, totalStaked };
}

/** "$1,234", "+$92", "-$140" */
export function fmtMoney(v: number, withSign = false): string {
  const n = Math.round(Math.abs(v));
  const body = `$${n.toLocaleString("en-US")}`;
  if (v < 0) return `-${body}`;
  return withSign && v > 0 ? `+${body}` : body;
}

export function cornerName(fight: Fight, pick: Corner, nameOf: (code: string) => string): string {
  return nameOf(pick === "R" ? fight.red : fight.blue);
}
