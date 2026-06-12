"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Match, ResultScore, SavedState, StorageMode, emptyState } from "./types";
import { SEED_MATCHES, SEED_RESULTS } from "./fixtures";
import { simulateResult } from "./engine";
import { BettingBook, computeBook } from "./betting";

const LS_STATE = "competeai-state-v1";
const LS_PIN = "competeai-admin-pin";

export type SyncStatus = "idle" | "saving" | "saved" | "error" | "unauthorized";

export interface ServerInfo {
  mode: StorageMode;
  pinRequired: boolean;
  reachable: boolean;
}

interface StoreValue {
  hydrated: boolean;
  state: SavedState;
  server: ServerInfo;
  sync: SyncStatus;
  matches: Match[]; // seed + custom - hidden, kickoff-sorted
  betting: BettingBook; // odds, stakes and bankrolls, derived from results
  resultFor: (matchId: string) => ResultScore | null;
  isSeedResult: (matchId: string) => boolean;
  setResult: (matchId: string, r: ResultScore | null) => void;
  addMatch: (m: Omit<Match, "id">) => void;
  removeMatch: (matchId: string) => void;
  simulateRemaining: () => void;
  clearAllResults: () => void;
  resetAll: () => void;
  exportState: () => string;
  importState: (json: string) => string | null; // error message or null
  pin: string;
  setPin: (pin: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function loadLocal(): SavedState {
  try {
    const raw = localStorage.getItem(LS_STATE);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === 1) {
      return {
        version: 1,
        results: parsed.results ?? {},
        customMatches: Array.isArray(parsed.customMatches) ? parsed.customMatches : [],
        hiddenIds: Array.isArray(parsed.hiddenIds) ? parsed.hiddenIds : [],
        updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : 0,
      };
    }
  } catch {
    /* corrupted local state → start fresh */
  }
  return emptyState();
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<SavedState>(emptyState);
  const [server, setServer] = useState<ServerInfo>({
    mode: "unknown",
    pinRequired: false,
    reachable: false,
  });
  const [sync, setSync] = useState<SyncStatus>("idle");
  const [pin, setPinState] = useState("");
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const pinRef = useRef(pin);
  pinRef.current = pin;

  // Initial hydration: localStorage first, then reconcile with the server.
  useEffect(() => {
    const local = loadLocal();
    setState(local);
    setPinState(localStorage.getItem(LS_PIN) ?? "");
    setHydrated(true);

    (async () => {
      try {
        const res = await fetch("/api/state", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        setServer({
          mode: data.mode ?? "unknown",
          pinRequired: !!data.pinRequired,
          reachable: true,
        });
        const remote: SavedState | null = data.state ?? null;
        if (remote && remote.updatedAt > local.updatedAt) {
          // Server knows newer results (e.g. the admin updated them) → adopt.
          setState(remote);
          localStorage.setItem(LS_STATE, JSON.stringify(remote));
        }
      } catch {
        setServer((s) => ({ ...s, reachable: false }));
      }
    })();
  }, []);

  const pushToServer = useCallback((next: SavedState) => {
    if (pushTimer.current) clearTimeout(pushTimer.current);
    setSync("saving");
    pushTimer.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/state", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-admin-pin": pinRef.current,
          },
          body: JSON.stringify({ state: next }),
        });
        if (res.status === 401) {
          setSync("unauthorized");
          return;
        }
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        setServer((s) => ({ ...s, mode: data.mode ?? s.mode, reachable: true }));
        setSync("saved");
      } catch {
        setSync("error");
      }
    }, 500);
  }, []);

  const mutate = useCallback(
    (fn: (s: SavedState) => SavedState) => {
      setState((prev) => {
        const next = { ...fn(prev), updatedAt: Date.now() };
        try {
          localStorage.setItem(LS_STATE, JSON.stringify(next));
        } catch {
          /* storage full/blocked; state still lives in memory */
        }
        pushToServer(next);
        return next;
      });
    },
    [pushToServer],
  );

  const setPin = useCallback((value: string) => {
    setPinState(value);
    try {
      localStorage.setItem(LS_PIN, value);
    } catch {}
  }, []);

  const matches = useMemo(() => {
    const hidden = new Set(state.hiddenIds);
    return [...SEED_MATCHES, ...state.customMatches]
      .filter((m) => !hidden.has(m.id))
      .sort((a, b) => a.kickoff.localeCompare(b.kickoff) || a.id.localeCompare(b.id));
  }, [state.customMatches, state.hiddenIds]);

  const resultFor = useCallback(
    (matchId: string): ResultScore | null => {
      if (Object.prototype.hasOwnProperty.call(state.results, matchId)) {
        return state.results[matchId];
      }
      return SEED_RESULTS[matchId] ?? null;
    },
    [state.results],
  );

  const isSeedResult = useCallback(
    (matchId: string) =>
      !!SEED_RESULTS[matchId] &&
      !Object.prototype.hasOwnProperty.call(state.results, matchId),
    [state.results],
  );

  const betting = useMemo(() => computeBook(matches, resultFor), [matches, resultFor]);

  const value: StoreValue = {
    hydrated,
    state,
    server,
    sync,
    matches,
    betting,
    resultFor,
    isSeedResult,
    pin,
    setPin,
    setResult: (matchId, r) =>
      mutate((s) => {
        const results = { ...s.results };
        if (r === null) {
          if (SEED_RESULTS[matchId]) results[matchId] = null; // tombstone a seeded result
          else delete results[matchId];
        } else {
          results[matchId] = {
            homeGoals: Math.max(0, Math.min(99, Math.round(r.homeGoals))),
            awayGoals: Math.max(0, Math.min(99, Math.round(r.awayGoals))),
          };
        }
        return { ...s, results };
      }),
    addMatch: (m) =>
      mutate((s) => ({
        ...s,
        customMatches: [
          ...s.customMatches,
          { ...m, id: `c-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}` },
        ],
      })),
    removeMatch: (matchId) =>
      mutate((s) => {
        const isCustom = s.customMatches.some((m) => m.id === matchId);
        const results = { ...s.results };
        delete results[matchId];
        return {
          ...s,
          results,
          customMatches: s.customMatches.filter((m) => m.id !== matchId),
          hiddenIds: isCustom ? s.hiddenIds : [...new Set([...s.hiddenIds, matchId])],
        };
      }),
    simulateRemaining: () =>
      mutate((s) => {
        const results = { ...s.results };
        for (const m of matches) {
          const existing = Object.prototype.hasOwnProperty.call(results, m.id)
            ? results[m.id]
            : SEED_RESULTS[m.id] ?? null;
          if (existing === null || existing === undefined) {
            results[m.id] = simulateResult(m);
          }
        }
        return { ...s, results };
      }),
    clearAllResults: () =>
      mutate((s) => {
        const results: SavedState["results"] = {};
        for (const id of Object.keys(SEED_RESULTS)) results[id] = null;
        return { ...s, results };
      }),
    resetAll: () =>
      mutate(() => ({ ...emptyState(), updatedAt: Date.now() })),
    exportState: () => JSON.stringify(stateRef.current, null, 2),
    importState: (json) => {
      try {
        const parsed = JSON.parse(json);
        if (!parsed || parsed.version !== 1 || typeof parsed.results !== "object") {
          return "That file doesn't look like a CompeteAI export (missing version/results).";
        }
        mutate(() => ({
          version: 1,
          results: parsed.results ?? {},
          customMatches: Array.isArray(parsed.customMatches) ? parsed.customMatches : [],
          hiddenIds: Array.isArray(parsed.hiddenIds) ? parsed.hiddenIds : [],
          updatedAt: Date.now(),
        }));
        return null;
      } catch (e) {
        return "Could not parse that file as JSON.";
      }
    },
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
