import { CardSlot, Fight, FightEvent, FightResult } from "./types";

/**
 * The card. The league runs on the upcoming UFC White House event (Topuria vs.
 * Gaethje, June 14). The bouts, weight classes and order are taken from the
 * announced card. Because the event has not happened yet, SEED_RESULTS is
 * empty: every model has locked its picks and placed pending bets, and every
 * bankroll sits at the $1,000 buy-in until the fights are scored.
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
  F("wh", 1, "Main Event", 5, true, "TOPURIA", "GAETHJE", "Lightweight Title"),
  F("wh", 2, "Co-Main", 5, true, "PEREIRA", "GANE", "Interim Heavyweight Title"),
  F("wh", 3, "Main Card", 3, false, "OMALLEY", "ZAHABI", "Bantamweight"),
  F("wh", 4, "Main Card", 3, false, "LEWIS", "HOKIT", "Heavyweight"),
  F("wh", 5, "Main Card", 3, false, "CHANDLER", "RUFFY", "Lightweight"),
  F("wh", 6, "Main Card", 3, false, "NICKAL", "DAUKAUS", "Middleweight"),
  F("wh", 7, "Main Card", 3, false, "DLOPES", "SGARCIA", "Featherweight"),
];

/**
 * No fights have been contested yet, so there are no results. Add them here
 * (or via POST /api/state) as the card plays out; ids are `EVENT-RED-BLUE`,
 * winner is "R" or "B", round is 0 for a decision. Example:
 *   "wh-TOPURIA-GAETHJE": { winner: "R", method: "KO", round: 3 },
 */
export const SEED_RESULTS: Record<string, FightResult> = {};

/**
 * Global chronological key for settlement order: within an event the prelims
 * (higher order) settle before the main event.
 */
export function chronoIndex(fight: Fight): number {
  const date = EVENT_MAP[fight.eventId]?.date ?? "2999-01-01";
  return Date.parse(date) - fight.order * 60000;
}
