"use client";

import { useStore } from "@/lib/store";
import { MODELS } from "@/lib/models";
import { computeStandings } from "@/lib/scoring";
import { predictionFor, describePrediction } from "@/lib/engine";
import { fmtMoney, americanOdds, cornerName } from "@/lib/betting";
import { fighter } from "@/lib/fighters";
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
  const { hydrated, fights, resultFor, betting } = useStore();

  if (!hydrated)
    return (
      <div className="page-pad">
        <div className="skel">Introducing the cornermen…</div>
      </div>
    );

  const standings = computeStandings(fights, resultFor);
  const nextFight = fights.find((f) => !resultFor(f.id));
  const fightById = new Map(fights.map((f) => [f.id, f]));

  return (
    <div className="page-pad">
      <div className="kicker">Meet the cornermen</div>
      <h1 className="page-title">The Models</h1>
      <p className="page-sub">
        Same card, same moneyline, four very different philosophies, about
        fighting and about money. Each persona is a deterministic strategy
        tuned to how its namesake carries itself, from risk appetite to how
        hard it hammers the betting window.
      </p>

      <div className="model-grid">
        {MODELS.map((meta) => {
          const s = standings.find((x) => x.model === meta.id)!;
          const w = betting.walletOf[meta.id];
          const rank = standings.indexOf(s) + 1;
          const take = nextFight ? predictionFor(nextFight, meta.id) : null;
          const bestWin = w.biggestWin;
          const bestWinFight = bestWin ? fightById.get(bestWin.fightId) : undefined;
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
                  <div
                    className={`tiny ${w.profit > 0 ? "money-up" : w.profit < 0 ? "money-down" : "faint"}`}
                    style={{ fontWeight: 700 }}
                  >
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
                <span>Record: {w.wins}-{w.settled - w.wins}</span>
                <span>
                  ROI:{" "}
                  <b className={w.roi > 0 ? "money-up" : w.roi < 0 ? "money-down" : ""}>
                    {w.staked ? `${w.roi > 0 ? "+" : ""}${w.roi}%` : "-"}
                  </b>
                </span>
              </div>
              {bestWin && bestWinFight && (
                <div className="tiny muted" style={{ marginTop: 6 }}>
                  Best cash: <b className="money-up">{fmtMoney(bestWin.profit, true)}</b> on{" "}
                  {cornerName(bestWinFight, bestWin.pick, (c) => fighter(c).name)} @{" "}
                  {americanOdds(bestWin.odds)}
                </div>
              )}

              <Trait label="Risk appetite" value={norm(meta.p.upset, 0.7, 1.6)} color={meta.color} />
              <Trait label="Stake aggression" value={norm(meta.betting.kelly, 0.15, 1.8)} color={meta.color} />
              <Trait label="Finish-hunting" value={norm(meta.p.finishLust, 0.7, 1.4)} color={meta.color} />
              <Trait label="Favourite reverence" value={norm(meta.p.favReverence, 0.7, 1.5)} color={meta.color} />

              {take && nextFight && (
                <div className="quote-box">
                  <div className="tiny faint" style={{ fontStyle: "normal", fontWeight: 700, marginBottom: 4 }}>
                    NEXT CALL: {fighter(nextFight.red).name} vs {fighter(nextFight.blue).name}:{" "}
                    {describePrediction(nextFight, take)}
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
