import { CardSlot, Fight, FightEvent, FightResult } from "./types";

/**
 * Two real UFC cards: the historic White House event (upcoming, the marquee
 * card) and the completed June 6 Fight Night whose real results seed the
 * leaderboard. Pairings, weight classes and methods/rounds are taken from the
 * announced cards and official results.
 *
 * EVENTS are listed in display order (soonest/marquee first).
 */
export const EVENTS: FightEvent[] = [
  {
    id: "wh",
    name: "UFC White House: Topuria vs. Gaethje",
    short: "UFC · White House",
    date: "2026-06-14",
    venue: "South Lawn, The White House",
    city: "Washington, D.C.",
  },
  {
    id: "fn",
    name: "UFC Fight Night: Muhammad vs. Bonfim",
    short: "UFC Vegas",
    date: "2026-06-06",
    venue: "UFC APEX",
    city: "Las Vegas, NV",
  },
];

export const EVENT_MAP: Record<string, FightEvent> = Object.fromEntries(
  EVENTS.map((e) => [e.id, e]),
);

export function getEvent(id: string): FightEvent | undefined {
  return EVENT_MAP[id];
}

const F = (
  eventId: string,
  order: number,
  slot: CardSlot,
  rounds: 3 | 5,
  title: boolean,
  red: string,
  blue: string,
  weightClass: string,
): Fight => ({
  id: `${eventId}-${red}-${blue}`,
  eventId,
  red,
  blue,
  weightClass,
  rounds,
  title,
  slot,
  order,
});

export const SEED_FIGHTS: Fight[] = [
  // ── UFC White House (June 14) — upcoming ──
  F("wh", 1, "Main Event", 5, true, "TOPURIA", "GAETHJE", "Lightweight Title"),
  F("wh", 2, "Co-Main", 5, true, "PEREIRA", "GANE", "Interim Heavyweight Title"),
  F("wh", 3, "Main Card", 3, false, "OMALLEY", "ZAHABI", "Bantamweight"),
  F("wh", 4, "Main Card", 3, false, "LEWIS", "HOKIT", "Heavyweight"),
  F("wh", 5, "Main Card", 3, false, "CHANDLER", "RUFFY", "Lightweight"),
  F("wh", 6, "Main Card", 3, false, "NICKAL", "DAUKAUS", "Middleweight"),
  F("wh", 7, "Main Card", 3, false, "DLOPES", "SGARCIA", "Featherweight"),

  // ── UFC Fight Night: Muhammad vs. Bonfim (June 6) — completed ──
  F("fn", 1, "Main Event", 5, false, "BELAL", "BONFIM", "Welterweight"),
  F("fn", 2, "Co-Main", 3, false, "ALLEN", "SHAHBAZYAN", "Middleweight"),
  F("fn", 3, "Main Card", 3, false, "NOLAN", "ZIAM", "Lightweight"),
  F("fn", 4, "Main Card", 3, false, "BMITCHELL", "LUNA", "Bantamweight"),
  F("fn", 5, "Main Card", 3, false, "BARANIEWSKI", "TAFA", "Light Heavyweight"),
  F("fn", 6, "Prelim", 3, false, "COSTA", "SCHNELL", "Flyweight"),
  F("fn", 7, "Prelim", 3, false, "MCGHEE", "YANNIS", "Bantamweight"),
  F("fn", 8, "Prelim", 3, false, "CHAIREZ", "DASILVA", "Flyweight"),
  F("fn", 9, "Prelim", 3, false, "CCHANDLER", "CACHOEIRA", "Women's Bantamweight"),
  F("fn", 10, "Prelim", 3, false, "BRITO", "LEAVITT", "Featherweight"),
  F("fn", 11, "Prelim", 3, false, "CHAVES", "DUBEN", "Women's Flyweight"),
  F("fn", 12, "Prelim", 3, false, "SOUZA", "CARNELOSSI", "Women's Strawweight"),
];

/**
 * Real results from June 6, shipped so a fresh deploy starts with a live
 * leaderboard. winner: R = red corner, B = blue corner. round 0 = decision.
 */
export const SEED_RESULTS: Record<string, FightResult> = {
  "fn-BELAL-BONFIM": { winner: "B", method: "DEC", round: 0 }, // Bonfim UD (upset)
  "fn-ALLEN-SHAHBAZYAN": { winner: "R", method: "DEC", round: 0 },
  "fn-NOLAN-ZIAM": { winner: "R", method: "DEC", round: 0 },
  "fn-BMITCHELL-LUNA": { winner: "R", method: "SUB", round: 3 },
  "fn-BARANIEWSKI-TAFA": { winner: "R", method: "KO", round: 1 },
  "fn-COSTA-SCHNELL": { winner: "R", method: "KO", round: 1 },
  "fn-MCGHEE-YANNIS": { winner: "R", method: "DEC", round: 0 },
  "fn-CHAIREZ-DASILVA": { winner: "R", method: "SUB", round: 1 },
  "fn-CCHANDLER-CACHOEIRA": { winner: "R", method: "SUB", round: 1 },
  "fn-BRITO-LEAVITT": { winner: "R", method: "SUB", round: 1 },
  "fn-CHAVES-DUBEN": { winner: "R", method: "DEC", round: 0 },
  "fn-SOUZA-CARNELOSSI": { winner: "R", method: "KO", round: 1 },
};

/**
 * Global chronological key for settlement order: earlier event first, and
 * within an event the prelims (higher order) settle before the main event.
 */
export function chronoIndex(fight: Fight): number {
  const date = EVENT_MAP[fight.eventId]?.date ?? "2999-01-01";
  return Date.parse(date) - fight.order * 60000;
}
