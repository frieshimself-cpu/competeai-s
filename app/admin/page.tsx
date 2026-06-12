"use client";

import { useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { team, ALL_TEAM_CODES, TEAMS } from "@/lib/teams";
import { Match, ResultScore, Stage, STAGE_LABELS } from "@/lib/types";
import { fmtKickoff } from "@/components/MatchCard";

function ResultRow({
  match,
  result,
  seeded,
  onSave,
  onClear,
  onRemove,
}: {
  match: Match;
  result: ResultScore | null;
  seeded: boolean;
  onSave: (r: ResultScore) => void;
  onClear: () => void;
  onRemove?: () => void;
}) {
  const [h, setH] = useState(result ? String(result.homeGoals) : "");
  const [a, setA] = useState(result ? String(result.awayGoals) : "");
  const dirty =
    h !== (result ? String(result.homeGoals) : "") ||
    a !== (result ? String(result.awayGoals) : "");
  const valid = /^\d{1,2}$/.test(h) && /^\d{1,2}$/.test(a);

  return (
    <div className="admin-row">
      <span className="when">{fmtKickoff(match.kickoff)}</span>
      <span className="pill">{match.stage === "group" ? `Grp ${match.group}` : STAGE_LABELS[match.stage]}</span>
      <div className="matchup">
        <span>{team(match.home).flag}</span>
        <span>{team(match.home).name}</span>
        <span className="faint">vs</span>
        <span>{team(match.away).flag}</span>
        <span>{team(match.away).name}</span>
        {seeded && result && <span className="pill green tiny">seeded result</span>}
      </div>
      <input
        type="number"
        className="score"
        min={0}
        max={99}
        placeholder="–"
        value={h}
        onChange={(e) => setH(e.target.value)}
      />
      <span className="faint">:</span>
      <input
        type="number"
        className="score"
        min={0}
        max={99}
        placeholder="–"
        value={a}
        onChange={(e) => setA(e.target.value)}
      />
      <button
        className="btn primary"
        disabled={!valid || !dirty}
        onClick={() => onSave({ homeGoals: parseInt(h, 10), awayGoals: parseInt(a, 10) })}
      >
        Save
      </button>
      {result && (
        <button
          className="btn ghost"
          onClick={() => {
            setH("");
            setA("");
            onClear();
          }}
        >
          Clear
        </button>
      )}
      {onRemove && (
        <button className="btn danger" onClick={onRemove} title="Remove this match">
          ✕
        </button>
      )}
    </div>
  );
}

const KNOCKOUT_STAGES: Stage[] = ["r32", "r16", "qf", "sf", "third", "final"];

export default function AdminPage() {
  const store = useStore();
  const {
    hydrated,
    matches,
    resultFor,
    isSeedResult,
    setResult,
    addMatch,
    removeMatch,
    simulateRemaining,
    clearAllResults,
    resetAll,
    exportState,
    importState,
    server,
    sync,
    pin,
    setPin,
    state,
  } = store;

  const [tab, setTab] = useState<"pending" | "finished" | "add" | "data">("pending");
  const [notice, setNotice] = useState<{ kind: "ok" | "warn" | "err"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // add-match form state
  const [stage, setStage] = useState<Stage>("r32");
  const [home, setHome] = useState("ARG");
  const [away, setAway] = useState("FRA");
  const [when, setWhen] = useState("2026-06-29T15:00");
  const [city, setCity] = useState("");

  const pending = useMemo(
    () => matches.filter((m) => !resultFor(m.id)),
    [matches, resultFor],
  );
  const finished = useMemo(
    () => matches.filter((m) => !!resultFor(m.id)).reverse(),
    [matches, resultFor],
  );

  if (!hydrated) return <div className="skel">Opening the control room…</div>;

  const teamOptions = ALL_TEAM_CODES.map((c) => TEAMS[c]).sort((x, y) =>
    x.name.localeCompare(y.name),
  );

  const syncLabel =
    sync === "saving"
      ? "saving…"
      : sync === "saved"
        ? "synced to server"
        : sync === "unauthorized"
          ? "server rejected PIN — saved in this browser only"
          : sync === "error"
            ? "server unreachable — saved in this browser only"
            : "idle";

  const modeExplain =
    server.mode === "kv"
      ? "Cloud KV storage is connected — results are shared with every visitor and survive deploys."
      : server.mode === "file"
        ? "Dev file storage (.data/state.json) — results persist locally across restarts."
        : server.mode === "memory"
          ? "No KV store configured, so the server only keeps results in memory (per warm instance). Your browser's localStorage is the durable copy — connect Upstash/Vercel KV to share results with all visitors."
          : "Server storage not reachable — running fully on browser localStorage.";

  return (
    <>
      <div className="kicker">Control room</div>
      <h1 className="page-title">Admin</h1>
      <p className="page-sub">
        Enter real World Cup results as they happen — the league rescoreboards
        instantly. Add knockout fixtures once the bracket fills in.
      </p>

      <div className="card" style={{ marginTop: 22 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <span className={`pill ${server.mode === "kv" ? "green" : server.mode === "file" ? "gold" : ""}`}>
            storage: {server.mode}
          </span>
          <span className="pill">sync: {syncLabel}</span>
          <span className="pill">last change: {state.updatedAt ? new Date(state.updatedAt).toLocaleString() : "—"}</span>
          {server.pinRequired && (
            <span style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
              <span className="tiny faint">ADMIN PIN</span>
              <input
                type="password"
                value={pin}
                placeholder="required to save to server"
                onChange={(e) => setPin(e.target.value)}
                style={{ width: 180 }}
              />
            </span>
          )}
        </div>
        <p className="muted small" style={{ margin: "10px 0 0" }}>{modeExplain}</p>
      </div>

      <div className="filters" style={{ marginTop: 22 }}>
        {(
          [
            ["pending", `Enter results (${pending.length})`],
            ["finished", `Finished (${finished.length})`],
            ["add", "Add match"],
            ["data", "Data & demo"],
          ] as const
        ).map(([t, label]) => (
          <button key={t} className={`fpill ${tab === t ? "on" : ""}`} onClick={() => setTab(t)}>
            {label}
          </button>
        ))}
      </div>

      {notice && <div className={`notice ${notice.kind}`}>{notice.text}</div>}

      {tab === "pending" && (
        <div className="card" style={{ marginTop: 16 }}>
          {pending.length === 0 ? (
            <div className="empty">Every fixture has a result. Add the next round in “Add match”.</div>
          ) : (
            pending.map((m) => (
              <ResultRow
                key={m.id}
                match={m}
                result={null}
                seeded={false}
                onSave={(r) => {
                  setResult(m.id, r);
                  setNotice({ kind: "ok", text: `Saved ${team(m.home).name} ${r.homeGoals}–${r.awayGoals} ${team(m.away).name}. Leaderboard updated.` });
                }}
                onClear={() => setResult(m.id, null)}
                onRemove={m.id.startsWith("c-") ? () => removeMatch(m.id) : undefined}
              />
            ))
          )}
        </div>
      )}

      {tab === "finished" && (
        <div className="card" style={{ marginTop: 16 }}>
          {finished.length === 0 ? (
            <div className="empty">No results yet.</div>
          ) : (
            finished.map((m) => (
              <ResultRow
                key={m.id}
                match={m}
                result={resultFor(m.id)}
                seeded={isSeedResult(m.id)}
                onSave={(r) => {
                  setResult(m.id, r);
                  setNotice({ kind: "ok", text: "Result updated." });
                }}
                onClear={() => {
                  setResult(m.id, null);
                  setNotice({ kind: "warn", text: "Result cleared — the match is back in the pending list." });
                }}
                onRemove={m.id.startsWith("c-") ? () => removeMatch(m.id) : undefined}
              />
            ))
          )}
        </div>
      )}

      {tab === "add" && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 16 }}>Add a knockout fixture</h3>
          <p className="muted small">
            As the bracket resolves, add Round of 32 onwards here — all four
            models will lock predictions for it immediately.
          </p>
          <div className="formgrid">
            <div>
              <label>Stage</label>
              <select value={stage} onChange={(e) => setStage(e.target.value as Stage)}>
                {KNOCKOUT_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Home team</label>
              <select value={home} onChange={(e) => setHome(e.target.value)}>
                {teamOptions.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.flag} {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Away team</label>
              <select value={away} onChange={(e) => setAway(e.target.value)}>
                {teamOptions.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.flag} {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Kickoff (your local time)</label>
              <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
            </div>
            <div>
              <label>City (optional)</label>
              <input type="text" value={city} placeholder="e.g. Dallas" onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <button
              className="btn primary"
              disabled={home === away || !when}
              onClick={() => {
                addMatch({ stage, home, away, kickoff: when, city: city || undefined });
                setNotice({
                  kind: "ok",
                  text: `Added ${STAGE_LABELS[stage]}: ${team(home).name} vs ${team(away).name}. The models have made their calls.`,
                });
              }}
            >
              Add fixture
            </button>
            {home === away && <span className="tiny faint" style={{ marginLeft: 10 }}>pick two different teams</span>}
          </div>
        </div>
      )}

      {tab === "data" && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 16 }}>Demo tools</h3>
          <p className="muted small">
            Want to see the league with a full season of data? Simulate the
            remaining fixtures (realistic, strength-weighted random results),
            then clear them when you want the real tournament back.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              className="btn"
              onClick={() => {
                simulateRemaining();
                setNotice({ kind: "ok", text: "Simulated results for every remaining fixture. The leaderboard is now fully populated." });
              }}
            >
              🎲 Simulate remaining results
            </button>
            <button
              className="btn danger"
              onClick={() => {
                clearAllResults();
                setNotice({ kind: "warn", text: "All results cleared (including the seeded opening-day results)." });
              }}
            >
              Clear all results
            </button>
            <button
              className="btn danger"
              onClick={() => {
                resetAll();
                setNotice({ kind: "warn", text: "Everything reset to the shipped seed data (opening-day results restored)." });
              }}
            >
              Reset to seed data
            </button>
          </div>

          <h3 style={{ fontSize: 16, marginTop: 26 }}>Backup & restore</h3>
          <p className="muted small">
            The full league state as portable JSON — handy for moving data
            between browsers when no KV store is configured.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              className="btn"
              onClick={() => {
                const blob = new Blob([exportState()], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "competeai-worldcup26-state.json";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              ⬇ Export JSON
            </button>
            <button className="btn" onClick={() => fileRef.current?.click()}>
              ⬆ Import JSON
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              style={{ display: "none" }}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const err = importState(await f.text());
                setNotice(
                  err
                    ? { kind: "err", text: err }
                    : { kind: "ok", text: "State imported and saved." },
                );
                e.target.value = "";
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
