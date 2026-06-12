"use client";

import { useStore } from "@/lib/store";
import { MODEL_MAP } from "@/lib/models";
import {
  bestCalls,
  computeStandings,
  cumulativeSeries,
  POINTS,
} from "@/lib/scoring";
import { team } from "@/lib/teams";
import { ModelAvatar } from "@/components/ModelAvatar";
import { FormDots } from "@/components/FormDots";
import { PointsChart } from "@/components/PointsChart";
import { fmtKickoff } from "@/components/MatchCard";

export default function LeaderboardPage() {
  const { hydrated, matches, resultFor } = useStore();

  if (!hydrated) return <div className="skel">Tallying the points…</div>;

  const standings = computeStandings(matches, resultFor);
  const { matches: done, series } = cumulativeSeries(matches, resultFor);
  const calls = bestCalls(matches, resultFor, 4);

  return (
    <>
      <div className="kicker">The table that matters</div>
      <h1 className="page-title">Leaderboard</h1>
      <p className="page-sub">
        {done.length === 0
          ? "No results scored yet — the table fills in as real World Cup results are entered in Admin."
          : `Scored across ${done.length} completed ${done.length === 1 ? "match" : "matches"}. Exact scorelines are worth ${POINTS.exact}, right goal difference ${POINTS.gd}, right outcome ${POINTS.outcome}.`}
      </p>

      <div className="card table-card" style={{ marginTop: 24 }}>
        <table className="standings">
          <thead>
            <tr>
              <th>Model</th>
              <th>Pts</th>
              <th>Exact (+5)</th>
              <th>GD (+3)</th>
              <th>Outcome (+2)</th>
              <th>Missed</th>
              <th>Accuracy</th>
              <th>Last 5</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => {
              const meta = MODEL_MAP[s.model];
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
                  <td className="pts">{s.points}</td>
                  <td>{s.exact}</td>
                  <td>{s.gd}</td>
                  <td>{s.outcome}</td>
                  <td>{s.miss}</td>
                  <td>{s.scored ? `${s.accuracy}%` : "—"}</td>
                  <td>
                    <FormDots last5={s.last5} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 className="section-title">The race</h2>
      <PointsChart matches={done} series={series} />

      <h2 className="section-title">Best calls so far</h2>
      {calls.length === 0 ? (
        <div className="empty">Once results land, the sharpest predictions get celebrated here.</div>
      ) : (
        <div className="grid2">
          {calls.map((c, i) => {
            const meta = MODEL_MAP[c.model];
            return (
              <div className="card" key={i}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <ModelAvatar meta={meta} size="md" />
                  <b>{meta.name}</b>
                  <span className={`pill ${c.points === 5 ? "gold" : "green"}`} style={{ marginLeft: "auto" }}>
                    +{c.points} pts{c.upset ? " · upset called" : ""}
                  </span>
                </div>
                <div className="small">
                  Predicted{" "}
                  <b>
                    {team(c.match.home).flag} {c.prediction.homeGoals}–{c.prediction.awayGoals}{" "}
                    {team(c.match.away).flag}
                  </b>{" "}
                  — it finished{" "}
                  <b>
                    {c.result.homeGoals}–{c.result.awayGoals}
                  </b>
                  .
                </div>
                <div className="muted small" style={{ marginTop: 6 }}>
                  {team(c.match.home).name} vs {team(c.match.away).name} ·{" "}
                  {fmtKickoff(c.match.kickoff)}
                </div>
                <div className="quote-box">“{c.prediction.reasoning}”</div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
