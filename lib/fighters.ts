import { Fighter } from "./types";

/**
 * The fighters across the two seeded UFC cards. Ratings are a rough overall
 * strength index (1-100) the prediction engines reason over; `ko` is how
 * likely a finish from this fighter is a knockout vs a submission. Records
 * are an editorial snapshot, not a live feed.
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
  // ── UFC White House (June 14) ──
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

  // ── UFC Fight Night: Muhammad vs. Bonfim (June 6) ──
  BELAL: F("BELAL", "Belal Muhammad", "BEL", "🇵🇸", "Palestine/USA", "24-4-0", 87, 0.45, "Remember the Name"),
  BONFIM: F("BONFIM", "Gabriel Bonfim", "BON", "🇧🇷", "Brazil", "17-1-0", 81, 0.55),
  ALLEN: F("ALLEN", "Brendan Allen", "ALL", "🇺🇸", "USA", "25-7-0", 83, 0.4, "All In"),
  SHAHBAZYAN: F("SHAHBAZYAN", "Edmen Shahbazyan", "SHA", "🇦🇲", "USA/Armenia", "13-5-0", 76, 0.7),
  NOLAN: F("NOLAN", "Tom Nolan", "NOL", "🇦🇺", "Australia", "9-2-0", 78, 0.6),
  ZIAM: F("ZIAM", "Farès Ziam", "ZIA", "🇫🇷", "France", "16-5-0", 77, 0.5),
  BMITCHELL: F("BMITCHELL", "Bryce Mitchell", "MIT", "🇺🇸", "USA", "17-3-0", 78, 0.2, "Thug Nasty"),
  LUNA: F("LUNA", "Santiago Luna", "LUN", "🇦🇷", "Argentina", "12-3-0", 67, 0.6),
  BARANIEWSKI: F("BARANIEWSKI", "Iwo Baraniewski", "BAR", "🇵🇱", "Poland", "9-2-0", 73, 0.8),
  TAFA: F("TAFA", "Junior Tafa", "TAF", "🇦🇺", "Australia", "6-2-0", 70, 0.85),
  COSTA: F("COSTA", "Alessandro Costa", "COS", "🇧🇷", "Brazil", "14-4-0", 73, 0.7),
  SCHNELL: F("SCHNELL", "Matt Schnell", "SCH", "🇺🇸", "USA", "16-8-0", 68, 0.4),
  MCGHEE: F("MCGHEE", "Marcus McGhee", "MGH", "🇺🇸", "USA", "9-1-0", 74, 0.6),
  YANNIS: F("YANNIS", "John Yannis", "YAN", "🇺🇸", "USA", "8-1-0", 65, 0.5),
  CHAIREZ: F("CHAIREZ", "Édgar Cháirez", "CHZ", "🇲🇽", "Mexico", "11-5-0", 72, 0.3),
  DASILVA: F("DASILVA", "Bruno da Silva", "SIL", "🇧🇷", "Brazil", "13-6-0", 70, 0.5),
  CCHANDLER: F("CCHANDLER", "Chelsea Chandler", "CCH", "🇺🇸", "USA", "7-2-0", 72, 0.4),
  CACHOEIRA: F("CACHOEIRA", "Priscila Cachoeira", "CAC", "🇧🇷", "Brazil", "12-5-0", 64, 0.6),
  BRITO: F("BRITO", "Joanderson Brito", "BRI", "🇧🇷", "Brazil", "16-4-1", 76, 0.5),
  LEAVITT: F("LEAVITT", "Jordan Leavitt", "LEA", "🇺🇸", "USA", "12-3-0", 69, 0.3),
  CHAVES: F("CHAVES", "Jeisla Chaves", "CHV", "🇧🇷", "Brazil", "10-3-0", 71, 0.5),
  DUBEN: F("DUBEN", "Yuneisy Duben", "DUB", "🇨🇺", "Cuba", "7-2-0", 70, 0.5),
  SOUZA: F("SOUZA", "Ketlen Souza", "SOU", "🇧🇷", "Brazil", "12-3-0", 72, 0.7),
  CARNELOSSI: F("CARNELOSSI", "Ariane Carnelossi", "CAR", "🇧🇷", "Brazil", "16-5-0", 67, 0.5),
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
