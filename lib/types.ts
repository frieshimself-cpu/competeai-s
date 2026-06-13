export type ModelId = "grok" | "chatgpt" | "claude" | "gemini";

/** Corner a fighter is in. Predictions always pick a corner (R or B). */
export type Corner = "R" | "B";

/** A fight result can also be a draw (rare), so it widens Corner. */
export type FightOutcome = "R" | "B" | "D";

/** How a fight ends. KO covers KO/TKO; SUB submission; DEC any decision. */
export type Method = "KO" | "SUB" | "DEC";

export const METHOD_WORD: Record<Method, string> = {
  KO: "KO/TKO",
  SUB: "submission",
  DEC: "decision",
};

export const METHOD_SHORT: Record<Method, string> = {
  KO: "KO",
  SUB: "SUB",
  DEC: "DEC",
};

export interface Fighter {
  code: string;
  name: string;
  short: string; // 3-4 char label for compact pick chips
  nick?: string;
  flag: string;
  country: string;
  record: string; // "26-5-0"
  rating: number; // 1-100 overall index used by the prediction engines
  /** When this fighter finishes, probability it's by KO (vs submission), 0-1. */
  ko: number;
}

export interface FightEvent {
  id: string;
  name: string;
  short: string;
  date: string; // ISO date (YYYY-MM-DD)
  venue: string;
  city: string;
}

export type CardSlot = "Main Event" | "Co-Main" | "Main Card" | "Prelim";

export interface Fight {
  id: string;
  eventId: string;
  red: string; // fighter code (A-side / favourite listing)
  blue: string; // fighter code
  weightClass: string;
  rounds: 3 | 5;
  title: boolean;
  slot: CardSlot;
  order: number; // 1 = main event, increasing down the card
}

export interface FightResult {
  winner: FightOutcome;
  method: Method;
  round: number; // 1-5 for finishes, 0 for decisions (went the distance)
}

export interface Prediction {
  fightId: string;
  model: ModelId;
  winner: Corner;
  method: Method;
  round: number; // predicted finish round, 0 for a decision
  confidence: number; // 0-100
  reasoning: string;
}

/**
 * Persisted delta on top of the seed data. `results[id] = null` is a
 * tombstone meaning "a seeded result was cleared".
 */
export interface SavedState {
  version: 1;
  results: Record<string, FightResult | null>;
  customFights: Fight[];
  hiddenIds: string[];
  updatedAt: number;
}

export function emptyState(): SavedState {
  return { version: 1, results: {}, customFights: [], hiddenIds: [], updatedAt: 0 };
}

export type StorageMode = "kv" | "file" | "memory" | "unknown";
