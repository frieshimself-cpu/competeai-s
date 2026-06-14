import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { CardSlot, Fight, FightOutcome, Method, SavedState, StorageMode } from "@/lib/types";
import { ALL_FIGHTER_CODES } from "@/lib/fighters";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const KEY = "competeai:ufc:state:v1";
const FILE = path.join(process.cwd(), ".data", "state.json");
const MAX_BODY = 256 * 1024;

/* ──────────────────────────────────────────────────────────────
 * Storage backends, best available wins:
 *   1. Vercel KV / Upstash Redis (REST)  → durable + shared
 *   2. Local JSON file                   → durable in `next dev`
 *   3. In-memory                         → best effort
 * ────────────────────────────────────────────────────────────── */

function kvCreds(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

const memory = globalThis as unknown as { __competeaiState?: SavedState };

async function readState(): Promise<{ mode: StorageMode; state: SavedState | null }> {
  const kv = kvCreds();
  if (kv) {
    const res = await fetch(`${kv.url}/get/${encodeURIComponent(KEY)}`, {
      headers: { Authorization: `Bearer ${kv.token}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`KV read failed (${res.status})`);
    const data = await res.json();
    return { mode: "kv", state: data.result ? JSON.parse(data.result) : null };
  }
  try {
    if (fs.existsSync(FILE)) {
      const state = JSON.parse(fs.readFileSync(FILE, "utf8"));
      return { mode: "file", state };
    }
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    return { mode: "file", state: memory.__competeaiState ?? null };
  } catch {
    return { mode: "memory", state: memory.__competeaiState ?? null };
  }
}

async function writeState(state: SavedState): Promise<StorageMode> {
  const kv = kvCreds();
  if (kv) {
    const res = await fetch(`${kv.url}/set/${encodeURIComponent(KEY)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${kv.token}` },
      body: JSON.stringify(state),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`KV write failed (${res.status})`);
    return "kv";
  }
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(state));
    return "file";
  } catch {
    memory.__competeaiState = state;
    return "memory";
  }
}

/* ──────────────────────────────────────────────────────────────
 * Validation: rebuild from scratch rather than trust the wire shape.
 * ────────────────────────────────────────────────────────────── */

const OUTCOMES = new Set<FightOutcome>(["R", "B", "D"]);
const METHODS = new Set<Method>(["KO", "SUB", "DEC"]);
const SLOTS = new Set<CardSlot>(["Main Event", "Co-Main", "Main Card", "Prelim"]);
const FIGHTER_SET = new Set(ALL_FIGHTER_CODES);

function sanitize(raw: unknown): SavedState | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const out: SavedState = {
    version: 1,
    results: {},
    customFights: [],
    hiddenIds: [],
    updatedAt: typeof r.updatedAt === "number" ? r.updatedAt : Date.now(),
  };

  const results = r.results;
  if (results && typeof results === "object") {
    for (const [id, value] of Object.entries(results as Record<string, unknown>)) {
      if (typeof id !== "string" || id.length > 90) continue;
      if (Object.keys(out.results).length >= 500) break;
      if (value === null) {
        out.results[id] = null;
        continue;
      }
      const v = value as Record<string, unknown>;
      const round = typeof v?.round === "number" ? Math.round(v.round) : NaN;
      if (
        OUTCOMES.has(v?.winner as FightOutcome) &&
        METHODS.has(v?.method as Method) &&
        round >= 0 &&
        round <= 5
      ) {
        out.results[id] = { winner: v.winner as FightOutcome, method: v.method as Method, round };
      }
    }
  }

  if (Array.isArray(r.customFights)) {
    for (const value of r.customFights.slice(0, 200)) {
      const f = value as Record<string, unknown>;
      if (
        typeof f?.id === "string" &&
        f.id.length <= 90 &&
        typeof f.eventId === "string" &&
        FIGHTER_SET.has(f.red as string) &&
        FIGHTER_SET.has(f.blue as string) &&
        f.red !== f.blue &&
        (f.rounds === 3 || f.rounds === 5) &&
        SLOTS.has(f.slot as CardSlot) &&
        typeof f.weightClass === "string" &&
        f.weightClass.length <= 50
      ) {
        out.customFights.push({
          id: f.id,
          eventId: (f.eventId as string).slice(0, 20),
          red: f.red as string,
          blue: f.blue as string,
          weightClass: f.weightClass,
          rounds: f.rounds as 3 | 5,
          title: !!f.title,
          slot: f.slot as CardSlot,
          order: typeof f.order === "number" ? f.order : 99,
        } as Fight);
      }
    }
  }

  if (Array.isArray(r.hiddenIds)) {
    out.hiddenIds = r.hiddenIds
      .filter((x): x is string => typeof x === "string" && x.length <= 90)
      .slice(0, 500);
  }

  return out;
}

/* ────────────────────────────────────────────────────────────── */

export async function GET() {
  try {
    const { mode, state } = await readState();
    return NextResponse.json({
      ok: true,
      mode,
      pinRequired: !!process.env.ADMIN_PIN,
      state,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "storage_unavailable" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const expected = process.env.ADMIN_PIN;
  if (expected && req.headers.get("x-admin-pin") !== expected) {
    return NextResponse.json({ ok: false, error: "bad_pin" }, { status: 401 });
  }

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY) {
      return NextResponse.json({ ok: false, error: "too_large" }, { status: 413 });
    }
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  const state = sanitize((body as Record<string, unknown>)?.state);
  if (!state) {
    return NextResponse.json({ ok: false, error: "bad_state" }, { status: 400 });
  }

  try {
    const mode = await writeState(state);
    return NextResponse.json({ ok: true, mode });
  } catch {
    return NextResponse.json({ ok: false, error: "storage_unavailable" }, { status: 500 });
  }
}
