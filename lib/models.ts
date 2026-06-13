import { ModelId } from "./types";

export interface Personality {
  /** >1 flattens probabilities toward coin-flips → more underdog picks */
  upset: number;
  /** multiplier on the chance a fight is predicted to reach the judges */
  decisionBias: number;
  /** >1 predicts more finishes, earlier */
  finishLust: number;
  /** >1 leans harder toward the higher-rated fighter / champion */
  favReverence: number;
  /** shift applied to displayed confidence (swagger vs humility) */
  confShift: number;
}

export interface BettingStyle {
  /** multiplier on the Kelly criterion stake (1 = full Kelly) */
  kelly: number;
  /** minimum fraction of bankroll wagered on every fight */
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
    tagline: "Every dog has its day. Bet it.",
    strategy:
      "Grok treats the betting favourite as a dare. It hunts live underdogs, calls highlight-reel knockouts, and when a +400 dog lands a head kick it will never let you forget it. Floor: low. Ceiling: viral.",
    p: { upset: 1.45, decisionBias: 0.7, finishLust: 1.32, favReverence: 0.8, confShift: 8 },
    betting: {
      kelly: 1.6,
      minFrac: 0.05,
      maxFrac: 0.28,
      blurb: "Over-Kelly degenerate. Sees a juicy underdog moneyline and clicks max.",
    },
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    vendor: "OpenAI",
    short: "GPT",
    color: "#10a37f",
    color2: "#1fd6a5",
    tagline: "The tale of the tape, weighted evenly.",
    strategy:
      "ChatGPT rides the consensus: rankings, recent form and the tale of the tape, weighted evenly. It leans toward the favourite and, more often than not, toward the judges' scorecards. Fewer fireworks, steadier points.",
    p: { upset: 1.0, decisionBias: 1.12, finishLust: 1.0, favReverence: 1.05, confShift: 0 },
    betting: {
      kelly: 0.6,
      minFrac: 0.02,
      maxFrac: 0.12,
      blurb: "Flat, disciplined unit-sizing on every fight. No chasing, no heaters.",
    },
  },
  {
    id: "claude",
    name: "Claude",
    vendor: "Anthropic",
    short: "CLD",
    color: "#d97757",
    color2: "#f4a261",
    tagline: "MMA is the highest-variance sport there is.",
    strategy:
      "Claude reasons about cardio, fight IQ and the championship rounds, then reminds you MMA is the highest-variance sport there is. It respects champions, expects decisions in close fights, and keeps its confidence numbers honest.",
    p: { upset: 0.88, decisionBias: 1.34, finishLust: 0.8, favReverence: 1.12, confShift: -6 },
    betting: {
      kelly: 0.35,
      minFrac: 0.015,
      maxFrac: 0.08,
      blurb: "Quarter-Kelly and capital-preservation minded. Sizes up only on the cleanest reads.",
    },
  },
  {
    id: "gemini",
    name: "Gemini",
    vendor: "Google",
    short: "GEM",
    color: "#5e8bff",
    color2: "#9168c0",
    tagline: "Significant strikes don't lie.",
    strategy:
      "Gemini runs the tale of the tape through a model: significant-strike differentials, takedown defence, finish rates, and its favourite input — title-fight pedigree, which it weights more than anyone. Chalk-leaning and proudly so.",
    p: { upset: 0.95, decisionBias: 0.95, finishLust: 1.06, favReverence: 1.4, confShift: 3 },
    betting: {
      kelly: 0.85,
      minFrac: 0.02,
      maxFrac: 0.16,
      blurb: "Fractional Kelly off the spreadsheet, and it sizes up whenever a belt is on the line.",
    },
  },
];

export const MODEL_MAP: Record<ModelId, ModelMeta> = Object.fromEntries(
  MODELS.map((m) => [m.id, m]),
) as Record<ModelId, ModelMeta>;

export const MODEL_IDS = MODELS.map((m) => m.id);
