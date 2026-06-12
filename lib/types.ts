export type ModelId = "grok" | "chatgpt" | "claude" | "gemini";

export type Stage = "group" | "r32" | "r16" | "qf" | "sf" | "third" | "final";

export const STAGE_LABELS: Record<Stage, string> = {
  group: "Group Stage",
  r32: "Round of 32",
  r16: "Round of 16",
  qf: "Quarter-final",
  sf: "Semi-final",
  third: "Third Place",
  final: "Final",
};

export interface Team {
  code: string;
  name: string;
  flag: string;
  rating: number; // 1-100 strength used by the prediction engines
  group: string | null;
}

export interface Match {
  id: string;
  stage: Stage;
  group?: string;
  home: string; // team code
  away: string; // team code
  kickoff: string; // ISO datetime
  city?: string;
}

export interface ResultScore {
  homeGoals: number;
  awayGoals: number;
}

export type Outcome = "H" | "D" | "A";

export interface Prediction {
  matchId: string;
  model: ModelId;
  homeGoals: number;
  awayGoals: number;
  outcome: Outcome;
  confidence: number; // 0-100
  reasoning: string;
}

/**
 * Everything that gets persisted (localStorage always, plus the server
 * when KV / file storage is available). Seed fixtures and seed results
 * live in code; this only stores deltas on top of them.
 *
 * `results[id] = null` is a tombstone meaning "a seeded result was cleared".
 */
export interface SavedState {
  version: 1;
  results: Record<string, ResultScore | null>;
  customMatches: Match[];
  hiddenIds: string[];
  updatedAt: number;
}

export function emptyState(): SavedState {
  return { version: 1, results: {}, customMatches: [], hiddenIds: [], updatedAt: 0 };
}

export type StorageMode = "kv" | "file" | "memory" | "unknown";

export function outcomeOf(homeGoals: number, awayGoals: number): Outcome {
  if (homeGoals > awayGoals) return "H";
  if (homeGoals < awayGoals) return "A";
  return "D";
}
