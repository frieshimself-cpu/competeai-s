import { Match, ResultScore } from "./types";

/**
 * The real 72-match group stage of the 2026 FIFA World Cup (June 11-27),
 * pairings taken from the official schedule. Kickoff times are stored in US
 * Eastern Time and are approximate for some matches; the pairings, groups
 * and matchdays are what the prediction league scores against.
 *
 * Knockout-round matches are added from the Admin page once groups resolve.
 */
const F = (
  kickoff: string,
  group: string,
  home: string,
  away: string,
  city: string,
): Match => ({
  id: `${group}-${home}-${away}`,
  stage: "group",
  group,
  home,
  away,
  kickoff: `${kickoff}:00-04:00`,
  city,
});

export const SEED_MATCHES: Match[] = [
  // ── Matchday 1 ──────────────────────────────────────────────
  F("2026-06-11T15:00", "A", "MEX", "RSA", "Mexico City"),
  F("2026-06-11T21:00", "A", "KOR", "CZE", "Guadalajara"),
  F("2026-06-12T15:00", "B", "CAN", "BIH", "Toronto"),
  F("2026-06-12T21:00", "D", "USA", "PAR", "Los Angeles"),
  F("2026-06-13T15:00", "B", "QAT", "SUI", "San Francisco"),
  F("2026-06-13T18:00", "C", "BRA", "MAR", "New York / NJ"),
  F("2026-06-13T21:00", "C", "HAI", "SCO", "Boston"),
  F("2026-06-13T22:00", "D", "AUS", "TUR", "Vancouver"),
  F("2026-06-14T15:00", "E", "GER", "CUW", "Houston"),
  F("2026-06-14T18:00", "F", "NED", "JPN", "Dallas"),
  F("2026-06-15T13:00", "E", "CIV", "ECU", "Philadelphia"),
  F("2026-06-15T15:00", "F", "SWE", "TUN", "Monterrey"),
  F("2026-06-15T17:00", "H", "ESP", "CPV", "Atlanta"),
  F("2026-06-15T19:00", "G", "BEL", "EGY", "Seattle"),
  F("2026-06-15T21:00", "H", "KSA", "URU", "Miami"),
  F("2026-06-16T15:00", "G", "IRN", "NZL", "Los Angeles"),
  F("2026-06-16T18:00", "I", "FRA", "SEN", "New York / NJ"),
  F("2026-06-16T21:00", "I", "IRQ", "NOR", "Boston"),
  F("2026-06-17T14:00", "J", "ARG", "ALG", "Kansas City"),
  F("2026-06-17T16:00", "J", "AUT", "JOR", "San Francisco"),
  F("2026-06-17T18:00", "K", "POR", "COD", "Houston"),
  F("2026-06-17T20:00", "L", "ENG", "CRO", "Dallas"),
  F("2026-06-18T13:00", "L", "GHA", "PAN", "Toronto"),
  F("2026-06-18T15:00", "K", "UZB", "COL", "Mexico City"),
  // ── Matchday 2 ──────────────────────────────────────────────
  F("2026-06-18T17:00", "A", "CZE", "RSA", "Atlanta"),
  F("2026-06-18T19:00", "B", "SUI", "BIH", "Los Angeles"),
  F("2026-06-18T21:00", "B", "CAN", "QAT", "Vancouver"),
  F("2026-06-19T15:00", "A", "MEX", "KOR", "Guadalajara"),
  F("2026-06-19T18:00", "D", "USA", "AUS", "Seattle"),
  F("2026-06-19T21:00", "C", "SCO", "MAR", "Boston"),
  F("2026-06-20T13:00", "C", "BRA", "HAI", "Philadelphia"),
  F("2026-06-20T15:00", "D", "TUR", "PAR", "San Francisco"),
  F("2026-06-20T18:00", "F", "NED", "SWE", "Houston"),
  F("2026-06-20T21:00", "E", "GER", "CIV", "Toronto"),
  F("2026-06-21T13:00", "E", "ECU", "CUW", "Kansas City"),
  F("2026-06-21T15:00", "F", "TUN", "JPN", "Monterrey"),
  F("2026-06-21T17:00", "H", "ESP", "KSA", "Atlanta"),
  F("2026-06-21T19:00", "G", "BEL", "IRN", "Los Angeles"),
  F("2026-06-21T21:00", "H", "URU", "CPV", "Miami"),
  F("2026-06-22T15:00", "G", "NZL", "EGY", "Vancouver"),
  F("2026-06-22T18:00", "J", "ARG", "AUT", "Dallas"),
  F("2026-06-22T21:00", "I", "FRA", "IRQ", "Philadelphia"),
  F("2026-06-23T14:00", "I", "NOR", "SEN", "Toronto"),
  F("2026-06-23T16:00", "J", "JOR", "ALG", "San Francisco"),
  F("2026-06-23T18:00", "K", "POR", "UZB", "Houston"),
  F("2026-06-23T20:00", "L", "ENG", "GHA", "Boston"),
  F("2026-06-24T12:00", "L", "PAN", "CRO", "Boston"),
  F("2026-06-24T14:00", "K", "COL", "COD", "Guadalajara"),
  // ── Matchday 3 (simultaneous finales) ───────────────────────
  F("2026-06-24T16:00", "B", "SUI", "CAN", "Vancouver"),
  F("2026-06-24T16:00", "B", "BIH", "QAT", "Seattle"),
  F("2026-06-24T20:00", "C", "MAR", "HAI", "Atlanta"),
  F("2026-06-24T20:00", "C", "SCO", "BRA", "Miami"),
  F("2026-06-25T16:00", "A", "RSA", "KOR", "Monterrey"),
  F("2026-06-25T16:00", "A", "CZE", "MEX", "Mexico City"),
  F("2026-06-25T20:00", "E", "CUW", "CIV", "Philadelphia"),
  F("2026-06-25T20:00", "E", "ECU", "GER", "New York / NJ"),
  F("2026-06-26T14:00", "F", "TUN", "NED", "Kansas City"),
  F("2026-06-26T14:00", "F", "JPN", "SWE", "Dallas"),
  F("2026-06-26T18:00", "D", "TUR", "USA", "Los Angeles"),
  F("2026-06-26T18:00", "D", "PAR", "AUS", "San Francisco"),
  F("2026-06-26T21:00", "I", "NOR", "FRA", "Boston"),
  F("2026-06-26T21:00", "I", "SEN", "IRQ", "Toronto"),
  F("2026-06-27T12:00", "H", "CPV", "KSA", "Houston"),
  F("2026-06-27T12:00", "H", "URU", "ESP", "Guadalajara"),
  F("2026-06-27T15:00", "G", "NZL", "BEL", "Vancouver"),
  F("2026-06-27T15:00", "G", "EGY", "IRN", "Seattle"),
  F("2026-06-27T17:00", "J", "JOR", "ARG", "Kansas City"),
  F("2026-06-27T17:00", "J", "ALG", "AUT", "Miami"),
  F("2026-06-27T19:00", "K", "COL", "POR", "Atlanta"),
  F("2026-06-27T19:00", "K", "COD", "UZB", "Toronto"),
  F("2026-06-27T21:00", "L", "PAN", "ENG", "New York / NJ"),
  F("2026-06-27T21:00", "L", "CRO", "GHA", "Philadelphia"),
];

/**
 * Real results already played, shipped with the app so a fresh deploy starts
 * with a live leaderboard. Further results are entered from /admin.
 */
export const SEED_RESULTS: Record<string, ResultScore> = {
  "A-MEX-RSA": { homeGoals: 2, awayGoals: 0 }, // June 11, Estadio Azteca
  "A-KOR-CZE": { homeGoals: 2, awayGoals: 1 }, // June 11, Guadalajara
};
