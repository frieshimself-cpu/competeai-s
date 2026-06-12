import { Team } from "./types";

/**
 * The 48 teams of the 2026 FIFA World Cup with their real groups from the
 * December 2025 draw. Ratings are a rough strength index (FIFA-ranking
 * flavoured) that the four prediction engines reason over.
 */
const T = (code: string, name: string, flag: string, rating: number, group: string): Team => ({
  code,
  name,
  flag,
  rating,
  group,
});

export const TEAMS: Record<string, Team> = {
  // Group A
  MEX: T("MEX", "Mexico", "🇲🇽", 78, "A"),
  RSA: T("RSA", "South Africa", "🇿🇦", 67, "A"),
  KOR: T("KOR", "South Korea", "🇰🇷", 76, "A"),
  CZE: T("CZE", "Czechia", "🇨🇿", 73, "A"),
  // Group B
  CAN: T("CAN", "Canada", "🇨🇦", 75, "B"),
  BIH: T("BIH", "Bosnia & Herzegovina", "🇧🇦", 69, "B"),
  QAT: T("QAT", "Qatar", "🇶🇦", 66, "B"),
  SUI: T("SUI", "Switzerland", "🇨🇭", 78, "B"),
  // Group C
  BRA: T("BRA", "Brazil", "🇧🇷", 89, "C"),
  MAR: T("MAR", "Morocco", "🇲🇦", 82, "C"),
  HAI: T("HAI", "Haiti", "🇭🇹", 59, "C"),
  SCO: T("SCO", "Scotland", "🏴󠁧󠁢󠁳󠁣󠁴󠁿", 72, "C"),
  // Group D
  USA: T("USA", "United States", "🇺🇸", 78, "D"),
  PAR: T("PAR", "Paraguay", "🇵🇾", 73, "D"),
  AUS: T("AUS", "Australia", "🇦🇺", 72, "D"),
  TUR: T("TUR", "Türkiye", "🇹🇷", 76, "D"),
  // Group E
  GER: T("GER", "Germany", "🇩🇪", 85, "E"),
  CUW: T("CUW", "Curaçao", "🇨🇼", 58, "E"),
  CIV: T("CIV", "Côte d'Ivoire", "🇨🇮", 73, "E"),
  ECU: T("ECU", "Ecuador", "🇪🇨", 77, "E"),
  // Group F
  NED: T("NED", "Netherlands", "🇳🇱", 86, "F"),
  JPN: T("JPN", "Japan", "🇯🇵", 80, "F"),
  SWE: T("SWE", "Sweden", "🇸🇪", 74, "F"),
  TUN: T("TUN", "Tunisia", "🇹🇳", 70, "F"),
  // Group G
  BEL: T("BEL", "Belgium", "🇧🇪", 83, "G"),
  EGY: T("EGY", "Egypt", "🇪🇬", 71, "G"),
  IRN: T("IRN", "Iran", "🇮🇷", 72, "G"),
  NZL: T("NZL", "New Zealand", "🇳🇿", 62, "G"),
  // Group H
  ESP: T("ESP", "Spain", "🇪🇸", 94, "H"),
  CPV: T("CPV", "Cape Verde", "🇨🇻", 63, "H"),
  KSA: T("KSA", "Saudi Arabia", "🇸🇦", 67, "H"),
  URU: T("URU", "Uruguay", "🇺🇾", 81, "H"),
  // Group I
  FRA: T("FRA", "France", "🇫🇷", 92, "I"),
  IRQ: T("IRQ", "Iraq", "🇮🇶", 63, "I"),
  NOR: T("NOR", "Norway", "🇳🇴", 77, "I"),
  SEN: T("SEN", "Senegal", "🇸🇳", 77, "I"),
  // Group J
  ARG: T("ARG", "Argentina", "🇦🇷", 93, "J"),
  ALG: T("ALG", "Algeria", "🇩🇿", 72, "J"),
  AUT: T("AUT", "Austria", "🇦🇹", 76, "J"),
  JOR: T("JOR", "Jordan", "🇯🇴", 65, "J"),
  // Group K
  POR: T("POR", "Portugal", "🇵🇹", 89, "K"),
  COD: T("COD", "DR Congo", "🇨🇩", 68, "K"),
  UZB: T("UZB", "Uzbekistan", "🇺🇿", 66, "K"),
  COL: T("COL", "Colombia", "🇨🇴", 81, "K"),
  // Group L
  CRO: T("CRO", "Croatia", "🇭🇷", 82, "L"),
  ENG: T("ENG", "England", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", 90, "L"),
  GHA: T("GHA", "Ghana", "🇬🇭", 70, "L"),
  PAN: T("PAN", "Panama", "🇵🇦", 66, "L"),
};

/** Host nations get a crowd-edge that some engines weight more than others. */
export const HOSTS = new Set(["USA", "MEX", "CAN"]);

export const GROUPS: Record<string, string[]> = Object.values(TEAMS).reduce(
  (acc, t) => {
    if (t.group) (acc[t.group] ||= []).push(t.code);
    return acc;
  },
  {} as Record<string, string[]>,
);

export const GROUP_LETTERS = Object.keys(GROUPS).sort();

export function team(code: string): Team {
  return (
    TEAMS[code] ?? { code, name: code, flag: "🏳️", rating: 70, group: null }
  );
}

export const ALL_TEAM_CODES = Object.keys(TEAMS);
