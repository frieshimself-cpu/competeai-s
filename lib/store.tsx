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
import { Fight, FightResult, SavedState, StorageMode, emptyState } from "./types";
import { SEED_FIGHTS, SEED_RESULTS, chronoIndex } from "./fixtures";
import { simulateResult } from "./engine";
import { BettingBook, computeBook } from "./betting";

const LS_STATE = "fightleague-ufc-state-v1";
const LS_PIN = "fightleague-admin-pin";

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
  fights: Fight[]; // seed + custom − hidden, card order
  betting: BettingBook;
  resultFor: (fightId: string) => FightResult | null;
  isSeedResult: (fightId: string) => boolean;
  setResult: (fightId: string, r: FightResult | null) => void;
  addFight: (f: Omit<Fight, "id">) => void;
  removeFight: (fightId: string) => void;
  simulateRemaining: () => void;
  clearAllResults: () => void;
  resetAll: () => void;
  exportState: () => string;
  importState: (json: string) => string | null;
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
        customFights: Array.isArray(parsed.customFights) ? parsed.customFights : [],
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
          headers: { "content-type": "application/json", "x-admin-pin": pinRef.current },
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

  const fights = useMemo(() => {
    const hidden = new Set(state.hiddenIds);
    return [...SEED_FIGHTS, ...state.customFights]
      .filter((f) => !hidden.has(f.id))
      .sort((a, b) => chronoIndex(b) - chronoIndex(a)); // marquee/soonest first, main event first
  }, [state.customFights, state.hiddenIds]);

  const resultFor = useCallback(
    (fightId: string): FightResult | null => {
      if (Object.prototype.hasOwnProperty.call(state.results, fightId)) {
        return state.results[fightId];
      }
      return SEED_RESULTS[fightId] ?? null;
    },
    [state.results],
  );

  const isSeedResult = useCallback(
    (fightId: string) =>
      !!SEED_RESULTS[fightId] &&
      !Object.prototype.hasOwnProperty.call(state.results, fightId),
    [state.results],
  );

  const betting = useMemo(() => computeBook(fights, resultFor), [fights, resultFor]);

  const value: StoreValue = {
    hydrated,
    state,
    server,
    sync,
    fights,
    betting,
    resultFor,
    isSeedResult,
    pin,
    setPin,
    setResult: (fightId, r) =>
      mutate((s) => {
        const results = { ...s.results };
        if (r === null) {
          if (SEED_RESULTS[fightId]) results[fightId] = null;
          else delete results[fightId];
        } else {
          results[fightId] = {
            winner: r.winner,
            method: r.method,
            round: Math.max(0, Math.min(5, Math.round(r.round))),
          };
        }
        return { ...s, results };
      }),
    addFight: (f) =>
      mutate((s) => ({
        ...s,
        customFights: [
          ...s.customFights,
          { ...f, id: `c-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}` },
        ],
      })),
    removeFight: (fightId) =>
      mutate((s) => {
        const isCustom = s.customFights.some((f) => f.id === fightId);
        const results = { ...s.results };
        delete results[fightId];
        return {
          ...s,
          results,
          customFights: s.customFights.filter((f) => f.id !== fightId),
          hiddenIds: isCustom ? s.hiddenIds : [...new Set([...s.hiddenIds, fightId])],
        };
      }),
    simulateRemaining: () =>
      mutate((s) => {
        const results = { ...s.results };
        for (const f of fights) {
          const existing = Object.prototype.hasOwnProperty.call(results, f.id)
            ? results[f.id]
            : SEED_RESULTS[f.id] ?? null;
          if (existing === null || existing === undefined) {
            results[f.id] = simulateResult(f);
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
    resetAll: () => mutate(() => ({ ...emptyState(), updatedAt: Date.now() })),
    exportState: () => JSON.stringify(stateRef.current, null, 2),
    importState: (json) => {
      try {
        const parsed = JSON.parse(json);
        if (!parsed || parsed.version !== 1 || typeof parsed.results !== "object") {
          return "That file doesn't look like an AI Fight League export (missing version/results).";
        }
        mutate(() => ({
          version: 1,
          results: parsed.results ?? {},
          customFights: Array.isArray(parsed.customFights) ? parsed.customFights : [],
          hiddenIds: Array.isArray(parsed.hiddenIds) ? parsed.hiddenIds : [],
          updatedAt: Date.now(),
        }));
        return null;
      } catch {
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
