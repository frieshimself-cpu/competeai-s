"use client";

import { useStore } from "@/lib/store";
import { MODELS } from "@/lib/models";
import { computeStandings } from "@/lib/scoring";
import { predictionFor } from "@/lib/engine";
import { fmtMoney, pickLabel } from "@/lib/betting";
import { team } from "@/lib/teams";
import { ModelAvatar } from "@/components/ModelAvatar";

function Trait({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="trait">
      <div className="lbl">
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <div className="bar">
        <div style={{ width: `${value * 100}%`, background: color }} />
      </div>
    </div>
  );
}

const norm = (v: number, lo: number, hi: number) =>
  Math.max(0.05, Math.min(1, (v - lo) / (hi - lo)));

export default function ModelsPage() {
  const { hydrated, matches, resultFor, betting } = useStore();

  if (!hydrated) return <div className="page-pad"><div className="skel">Introducing the contestants…</div></div>;

  const standings = computeStandings(matches, resultFor);
  const nextMatch = matches.find((m) => !resultFor(m.id));
  const matchById = new Map(matches.map((m) => [m.id, m]));

  return (
    <div className="page-pad">
      <div className="kicker">Meet the contestants</div>
      <h1 className="page-title">The Models</h1>
      <p className="page-sub">
        Same fixtures, same market odds, four very different philosophies —
        about football and about money. Each persona is a deterministic
        strategy tuned to how its namesake carries itself, from risk appetite
        to how hard it hammers the betting window.
      </p>

      <div className="model-grid">
        {MODELS.map((meta) => {
          const s = standings.find((x) => x.model === meta.id)!;
          const w = betting.walletOf[meta.id];
          const rank = standings.indexOf(s) + 1;
          const take = nextMatch ? predictionFor(nextMatch, meta.id) : null;
          const bestWin = w.biggestWin;
          const bestWinMatch = bestWin ? matchById.get(bestWin.matchId) : undefined;
          return (
            <div className="model-card" key={meta.id}>
              <div
                className="glow"
                style={{ background: `linear-gradient(120deg, ${meta.color}, ${meta.color2})` }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <ModelAvatar meta={meta} size="lg" />
                <div>
                  <h3 style={{ fontSize: 22 }}>{meta.name}</h3>
                  <div className="muted small">
                    {meta.vendor} · “{meta.tagline}”
                  </div>
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>{fmtMoney(w.bankroll)}</div>
                  <div className={`tiny ${w.profit > 0 ? "money-up" : w.profit < 0 ? "money-down" : "faint"}`} style={{ fontWeight: 700 }}>
                    {fmtMoney(w.profit, true)} · #{rank} · {s.points} pts
                  </div>
                </div>
              </div>

              <p className="muted" style={{ fontSize: 13.5, marginTop: 14 }}>
                {meta.strategy}
              </p>
              <p className="muted small" style={{ marginTop: 6 }}>
                💵 <b style={{ color: "var(--text)" }}>At the window:</b> {meta.betting.blurb}
              </p>

              <div className="statline" style={{ marginTop: 12 }}>
                <span>Bets settled: {w.settled}</span>
                <span>Record: {w.wins}–{w.settled - w.wins}</span>
                <span>
                  ROI:{" "}
                  <b className={w.roi > 0 ? "money-up" : w.roi < 0 ? "money-down" : ""}>
                    {w.staked ? `${w.roi > 0 ? "+" : ""}${w.roi}%` : "—"}
                  </b>
                </span>
              </div>
              {bestWin && bestWinMatch && (
                <div className="tiny muted" style={{ marginTop: 6 }}>
                  Best cash: <b className="money-up">{fmtMoney(bestWin.profit, true)}</b> on{" "}
                  {pickLabel(bestWinMatch, bestWin.pick, (c) => team(c).name)} @ {bestWin.odds.toFixed(2)}
                </div>
              )}

              <Trait label="Risk appetite" value={norm(meta.p.upset, 0.7, 1.6)} color={meta.color} />
              <Trait label="Stake aggression" value={norm(meta.betting.kelly, 0.15, 1.8)} color={meta.color} />
              <Trait label="Draw tolerance" value={norm(meta.p.drawBias, 0.6, 1.4)} color={meta.color} />
              <Trait label="Home-crowd faith" value={norm(meta.p.hostEdge, 0.6, 1.6)} color={meta.color} />

              {take && nextMatch && (
                <div className="quote-box">
                  <div className="tiny faint" style={{ fontStyle: "normal", fontWeight: 700, marginBottom: 4 }}>
                    NEXT CALL — {team(nextMatch.home).name} vs {team(nextMatch.away).name} (
                    {take.homeGoals}–{take.awayGoals})
                  </div>
                  “{take.reasoning}”
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
