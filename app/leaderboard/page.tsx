"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { MODEL_MAP } from "@/lib/models";
import { bestCalls, computeStandings, cumulativeSeries, POINTS } from "@/lib/scoring";
import { betFor, fmtMoney, americanOdds, START_BANKROLL } from "@/lib/betting";
import { fighter } from "@/lib/fighters";
import { describePrediction, describeFinish } from "@/lib/engine";
import { ModelAvatar } from "@/components/ModelAvatar";
import { FormDots } from "@/components/FormDots";
import { RaceChart } from "@/components/PointsChart";
import { fightWhen } from "@/components/FightCard";

export default function LeaderboardPage() {
  const { hydrated, fights, resultFor, betting } = useStore();
  const [view, setView] = useState<"bankroll" | "points">("bankroll");

  if (!hydrated)
    return (
      <div className="page-pad">
        <div className="skel">Reading the scorecards…</div>
      </div>
    );

  const standings = computeStandings(fights, resultFor);
  const { fights: done, series } = cumulativeSeries(fights, resultFor);
  const calls = bestCalls(fights, resultFor, 4);

  return (
    <div className="page-pad">
      <div className="kicker">The table that matters</div>
      <h1 className="page-title">Leaderboard</h1>
      <p className="page-sub">
        {done.length === 0
          ? "No results yet — bankrolls and points fill in as real fights are settled."
          : `Scored across ${done.length} completed ${done.length === 1 ? "fight" : "fights"}. A perfect call (winner + method + round) pays ${POINTS.exact} points, right method ${POINTS.method}, right winner ${POINTS.winner} — and every pick carries a moneyline stake.`}
      </p>

      <div className="card table-card" style={{ marginTop: 24 }}>
        <table className="standings">
          <thead>
            <tr>
              <th>Model</th>
              <th>Bankroll</th>
              <th>P/L</th>
              <th>ROI</th>
              <th>Pts</th>
              <th>Perfect (+5)</th>
              <th>Method (+3)</th>
              <th>Winner (+2)</th>
              <th>Accuracy</th>
              <th>Last 5</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => {
              const meta = MODEL_MAP[s.model];
              const w = betting.walletOf[s.model];
              return (
                <tr key={s.model}>
                  <td>
                    <div className="model-cell">
                      <span className="faint" style={{ width: 18 }}>{i + 1}</span>
                      <ModelAvatar meta={meta} size="md" />
                      <span>
                        {meta.name}
                        <span className="vendor">{meta.vendor}</span>
                      </span>
                      {i === 0 && done.length > 0 && <span title="League leader">👑</span>}
                    </div>
                  </td>
                  <td className="pts">{fmtMoney(w.bankroll)}</td>
                  <td className={w.profit > 0 ? "money-up" : w.profit < 0 ? "money-down" : ""}>
                    {fmtMoney(w.profit, true)}
                  </td>
                  <td className={w.roi > 0 ? "money-up" : w.roi < 0 ? "money-down" : ""}>
                    {w.staked ? `${w.roi > 0 ? "+" : ""}${w.roi}%` : "-"}
                  </td>
                  <td style={{ fontWeight: 800 }}>{s.points}</td>
                  <td>{s.exact}</td>
                  <td>{s.method}</td>
                  <td>{s.winner}</td>
                  <td>{s.scored ? `${s.accuracy}%` : "-"}</td>
                  <td>
                    <FormDots last5={s.last5} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="faint tiny" style={{ marginTop: 8 }}>
        League rank is decided by points. Bankrolls show what each model&apos;s
        conviction is worth — everyone bought in for {fmtMoney(START_BANKROLL)}.
      </p>

      <h2 className="section-title">
        The race
        <span className="hint" style={{ display: "inline-flex", gap: 6 }}>
          <button className={`fpill ${view === "bankroll" ? "on" : ""}`} onClick={() => setView("bankroll")}>
            💰 Bankroll
          </button>
          <button className={`fpill ${view === "points" ? "on" : ""}`} onClick={() => setView("points")}>
            League points
          </button>
        </span>
      </h2>
      {view === "bankroll" ? (
        <RaceChart
          count={betting.settledFights.length}
          series={betting.bankrollSeries}
          fmt={(v) => fmtMoney(v)}
          baseline={START_BANKROLL}
          caption="bankroll after each settled fight → (chronological order)"
        />
      ) : (
        <RaceChart
          count={done.length}
          series={series}
          fmt={(v) => String(Math.round(v))}
          zeroFloor
          caption="cumulative league points → (chronological order)"
        />
      )}

      <h2 className="section-title">Best calls so far</h2>
      {calls.length === 0 ? (
        <div className="empty">Once results land, the sharpest predictions get celebrated here.</div>
      ) : (
        <div className="grid2">
          {calls.map((c, i) => {
            const meta = MODEL_MAP[c.model];
            const bet = betFor(betting, c.fight.id, c.model);
            return (
              <div className="card" key={i}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                  <ModelAvatar meta={meta} size="md" />
                  <b>{meta.name}</b>
                  <span style={{ marginLeft: "auto", display: "inline-flex", gap: 6 }}>
                    {bet && bet.status === "won" && (
                      <span className="pill green">cashed {fmtMoney(bet.profit, true)}</span>
                    )}
                    <span className={`pill ${c.points === 5 ? "gold" : "green"}`}>
                      +{c.points} pts{c.upset ? " · upset called" : ""}
                    </span>
                  </span>
                </div>
                <div className="small">
                  Called <b>{describePrediction(c.fight, c.prediction)}</b> — it ended{" "}
                  <b>
                    {c.result.winner === "D"
                      ? "in a draw"
                      : `${fighter(c.result.winner === "R" ? c.fight.red : c.fight.blue).name} ${describeFinish(c.result.method, c.result.round)}`}
                  </b>
                  {bet && bet.status === "won" && (
                    <> with {fmtMoney(bet.stake)} riding at {americanOdds(bet.odds)}</>
                  )}
                  .
                </div>
                <div className="muted small" style={{ marginTop: 6 }}>
                  {fighter(c.fight.red).name} vs {fighter(c.fight.blue).name} · {fightWhen(c.fight)}
                </div>
                <div className="quote-box">“{c.prediction.reasoning}”</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
