import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Match, SavedState, Stage, StorageMode } from "@/lib/types";
import { ALL_TEAM_CODES } from "@/lib/teams";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const KEY = "competeai:worldcup26:state:v1";
const FILE = path.join(process.cwd(), ".data", "state.json");
const MAX_BODY = 256 * 1024;

/* ──────────────────────────────────────────────────────────────
 * Storage backends, best available wins:
 *   1. Vercel KV / Upstash Redis (REST)  → durable + shared
 *   2. Local JSON file                   → durable in `next dev`
 *   3. In-memory                         → best effort (the client
 *      keeps localStorage as source of truth anyway)
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
    // Probe writability so we report the mode we'd actually save with.
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
 * Validation — the saved blob is shared when KV is enabled, so
 * rebuild it from scratch instead of trusting the wire shape.
 * ────────────────────────────────────────────────────────────── */

const STAGES = new Set<Stage>(["group", "r32", "r16", "qf", "sf", "third", "final"]);
const TEAM_SET = new Set(ALL_TEAM_CODES);

function int(v: unknown, lo: number, hi: number): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  const n = Math.round(v);
  return n < lo || n > hi ? null : n;
}

function sanitize(raw: unknown): SavedState | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const out: SavedState = {
    version: 1,
    results: {},
    customMatches: [],
    hiddenIds: [],
    updatedAt: typeof r.updatedAt === "number" ? r.updatedAt : Date.now(),
  };

  const results = r.results;
  if (results && typeof results === "object") {
    for (const [id, value] of Object.entries(results as Record<string, unknown>)) {
      if (typeof id !== "string" || id.length > 80) continue;
      if (Object.keys(out.results).length >= 500) break;
      if (value === null) {
        out.results[id] = null;
        continue;
      }
      const v = value as Record<string, unknown>;
      const h = int(v?.homeGoals, 0, 99);
      const a = int(v?.awayGoals, 0, 99);
      if (h !== null && a !== null) out.results[id] = { homeGoals: h, awayGoals: a };
    }
  }

  if (Array.isArray(r.customMatches)) {
    for (const value of r.customMatches.slice(0, 200)) {
      const m = value as Record<string, unknown>;
      if (
        typeof m?.id === "string" &&
        m.id.length <= 80 &&
        STAGES.has(m.stage as Stage) &&
        TEAM_SET.has(m.home as string) &&
        TEAM_SET.has(m.away as string) &&
        m.home !== m.away &&
        typeof m.kickoff === "string" &&
        m.kickoff.length <= 40
      ) {
        const match: Match = {
          id: m.id,
          stage: m.stage as Stage,
          home: m.home as string,
          away: m.away as string,
          kickoff: m.kickoff,
        };
        if (typeof m.group === "string" && m.group.length === 1) match.group = m.group;
        if (typeof m.city === "string" && m.city.length <= 60) match.city = m.city;
        out.customMatches.push(match);
      }
    }
  }

  if (Array.isArray(r.hiddenIds)) {
    out.hiddenIds = r.hiddenIds
      .filter((x): x is string => typeof x === "string" && x.length <= 80)
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
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "storage_unavailable" },
      { status: 500 },
    );
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
    return NextResponse.json(
      { ok: false, error: "storage_unavailable" },
      { status: 500 },
    );
  }
}
