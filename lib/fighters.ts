import { Fighter } from "./types";

/**
 * The fighters on the UFC White House card. Ratings are a rough overall
 * strength index (1-100) the prediction engines reason over; `ko` is how
 * likely a finish from this fighter is a knockout vs a submission. Records
 * are a June 2026 snapshot, not a live feed.
 */
const F = (
  code: string,
  name: string,
  short: string,
  flag: string,
  country: string,
  record: string,
  rating: number,
  ko: number,
  nick?: string,
): Fighter => ({ code, name, short, flag, country, record, rating, ko, nick });

export const FIGHTERS: Record<string, Fighter> = {
  TOPURIA: F("TOPURIA", "Ilia Topuria", "TOP", "🇬🇪", "Georgia/Spain", "18-0-0", 96, 0.7, "El Matador"),
  GAETHJE: F("GAETHJE", "Justin Gaethje", "GAE", "🇺🇸", "USA", "27-5-0", 88, 0.85, "The Highlight"),
  PEREIRA: F("PEREIRA", "Alex Pereira", "PER", "🇧🇷", "Brazil", "13-3-0", 93, 0.92, "Poatan"),
  GANE: F("GANE", "Ciryl Gane", "GANE", "🇫🇷", "France", "13-2-0", 86, 0.7, "Bon Gamin"),
  OMALLEY: F("OMALLEY", "Sean O'Malley", "OMA", "🇺🇸", "USA", "19-3-0", 86, 0.75, "Suga"),
  ZAHABI: F("ZAHABI", "Aiemann Zahabi", "ZAH", "🇨🇦", "Canada", "13-2-0", 75, 0.5),
  LEWIS: F("LEWIS", "Derrick Lewis", "LEW", "🇺🇸", "USA", "29-13-0", 74, 0.95, "The Black Beast"),
  HOKIT: F("HOKIT", "Josh Hokit", "HOK", "🇺🇸", "USA", "5-1-0", 66, 0.6),
  CHANDLER: F("CHANDLER", "Michael Chandler", "CHA", "🇺🇸", "USA", "23-10-0", 83, 0.7, "Iron"),
  RUFFY: F("RUFFY", "Maurício Ruffy", "RUF", "🇧🇷", "Brazil", "11-1-0", 80, 0.8),
  NICKAL: F("NICKAL", "Bo Nickal", "NIC", "🇺🇸", "USA", "8-1-0", 84, 0.25),
  DAUKAUS: F("DAUKAUS", "Kyle Daukaus", "DAU", "🇺🇸", "USA", "13-4-0", 72, 0.4),
  DLOPES: F("DLOPES", "Diego Lopes", "LOP", "🇲🇽", "Mexico", "27-8-0", 87, 0.55, "The Brazilian"),
  SGARCIA: F("SGARCIA", "Steve Garcia", "GAR", "🇺🇸", "USA", "18-5-0", 79, 0.7, "Mean Machine"),
};

export function fighter(code: string): Fighter {
  return (
    FIGHTERS[code] ?? {
      code,
      name: code,
      short: code.slice(0, 3).toUpperCase(),
      flag: "🏳️",
      country: "",
      record: "0-0-0",
      rating: 70,
      ko: 0.5,
    }
  );
}

export const ALL_FIGHTER_CODES = Object.keys(FIGHTERS);
