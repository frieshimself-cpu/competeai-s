import { ModelId } from "./types";

export interface Personality {
  /** >1 flattens probabilities toward coin-flips → more upset picks */
  upset: number;
  /** multiplier on the baseline draw probability */
  drawBias: number;
  /** multiplier on expected goals → spicier or tighter scorelines */
  goals: number;
  /** how much weight host-nation crowd advantage gets */
  hostEdge: number;
  /** shift applied to displayed confidence (swagger vs humility) */
  confShift: number;
}

export interface BettingStyle {
  /** multiplier on the Kelly criterion stake (1 = full Kelly) */
  kelly: number;
  /** minimum fraction of bankroll wagered on every match */
  minFrac: number;
  /** hard cap as a fraction of bankroll */
  maxFrac: number;
  blurb: string;
}

export interface ModelMeta {
  id: ModelId;
  name: string;
  vendor: string;
  short: string; // avatar label
  color: string;
  color2: string; // gradient partner
  tagline: string;
  strategy: string;
  p: Personality;
  betting: BettingStyle;
}

export const MODELS: ModelMeta[] = [
  {
    id: "grok",
    name: "Grok",
    vendor: "xAI",
    short: "GRK",
    color: "#e8eaed",
    color2: "#9aa4b2",
    tagline: "Maximum spice, zero hedging.",
    strategy:
      "Grok treats consensus as a contrarian indicator. It flattens the odds, backs live underdogs, and forecasts goals, lots of them. When it hits an exact scoreline nobody saw coming it banks 5 points; when it doesn't, it would like you to know it was joking anyway.",
    p: { upset: 1.45, drawBias: 0.78, goals: 1.18, hostEdge: 0.8, confShift: 8 },
    betting: {
      kelly: 1.6,
      minFrac: 0.05,
      maxFrac: 0.28,
      blurb: "Over-Kelly degenerate. Sees a longshot it believes in and slams a quarter of the roll on it.",
    },
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    vendor: "OpenAI",
    short: "GPT",
    color: "#10a37f",
    color2: "#1fd6a5",
    tagline: "The consensus machine.",
    strategy:
      "ChatGPT plays it straight down the middle: squad depth, recent form, tournament pedigree, all weighted evenly. It rarely makes a wild call, which means fewer 5-point exacts but a steady drumbeat of correct outcomes. The index fund of football punditry.",
    p: { upset: 1.0, drawBias: 1.0, goals: 1.0, hostEdge: 1.0, confShift: 0 },
    betting: {
      kelly: 0.6,
      minFrac: 0.02,
      maxFrac: 0.12,
      blurb: "Dollar-cost averages through the tournament: small, steady, sensible stakes on every match.",
    },
  },
  {
    id: "claude",
    name: "Claude",
    vendor: "Anthropic",
    short: "CLD",
    color: "#d97757",
    color2: "#f4a261",
    tagline: "Carefully hedged, thoroughly reasoned.",
    strategy:
      "Claude reasons about pressing structures and transition risk, then reminds you the uncertainty is high. It respects favourites slightly more than the field, leans into draws when sides are evenly matched, and keeps scorelines conservative. Humble confidence numbers, often right anyway.",
    p: { upset: 0.88, drawBias: 1.28, goals: 0.92, hostEdge: 1.0, confShift: -6 },
    betting: {
      kelly: 0.35,
      minFrac: 0.015,
      maxFrac: 0.08,
      blurb: "Quarter-Kelly with a capital-preservation streak. Sizes up only when the edge survives scrutiny.",
    },
  },
  {
    id: "gemini",
    name: "Gemini",
    vendor: "Google",
    short: "GEM",
    color: "#5e8bff",
    color2: "#9168c0",
    tagline: "In the lab, the numbers never lie.",
    strategy:
      "Gemini runs everything through the spreadsheet: expected goals, form curves, travel fatigue, and its favourite variable, host-nation crowd effects, which it weights heavier than anyone else. Mildly chalk-flavoured, statistically armed, and never knowingly under-cited.",
    p: { upset: 0.95, drawBias: 0.9, goals: 1.06, hostEdge: 1.45, confShift: 3 },
    betting: {
      kelly: 0.85,
      minFrac: 0.02,
      maxFrac: 0.16,
      blurb: "Fractional Kelly straight off the spreadsheet, and it sizes up whenever a host nation is on the pitch.",
    },
  },
];

export const MODEL_MAP: Record<ModelId, ModelMeta> = Object.fromEntries(
  MODELS.map((m) => [m.id, m]),
) as Record<ModelId, ModelMeta>;

export const MODEL_IDS = MODELS.map((m) => m.id);
