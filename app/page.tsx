"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { MODEL_MAP } from "@/lib/models";
import { computeStandings, scoredMatches, POINTS } from "@/lib/scoring";
import { fmtMoney, START_BANKROLL } from "@/lib/betting";
import { MatchCard } from "@/components/MatchCard";
import { ModelAvatar } from "@/components/ModelAvatar";
import { FormDots } from "@/components/FormDots";

export default function Dashboard() {
  const { hydrated, matches, resultFor, betting } = useStore();

  if (!hydrated) {
    return <div className="skel">Warming up the pundits…</div>;
  }

  const standings = computeStandings(matches, resultFor);
  const done = scoredMatches(matches, resultFor);
  const upcoming = matches.filter((m) => !resultFor(m.id)).slice(0, 4);
  const recent = [...done].reverse().slice(0, 4);
  const leader = standings[0];

  return (
    <>
      <section className="hero">
        <div className="kicker">FIFA World Cup 2026 · June 11 — July 19 · USA · Mexico · Canada</div>
        <h1>
          Four AIs. A $1,000 bankroll each. <span className="grad">Only one cashes out a champion.</span>
        </h1>
        <p className="page-sub">
          Grok, ChatGPT, Claude and Gemini have called every match of the World
          Cup — and they&apos;re not just talking. Each model walked in with
          $1,000 and lays a stake on every single pick at market odds. Results
          land, bets settle, bankrolls bleed.
        </p>
      </section>

      <div className="podium">
        {standings.map((s, i) => {
          const meta = MODEL_MAP[s.model];
          const w = betting.walletOf[s.model];
          const isLeader = done.length > 0 && i === 0;
          return (
            <div key={s.model} className={`podium-card ${isLeader ? "leader" : ""}`}>
              <div
                className="glow"
                style={{ background: `linear-gradient(120deg, ${meta.color}, ${meta.color2})` }}
              />
              <span className="rank-chip">{isLeader ? "👑 #1" : `#${i + 1}`}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <ModelAvatar meta={meta} size="md" />
                <div>
                  <div style={{ fontWeight: 800 }}>{meta.name}</div>
                  <div className="faint tiny">{meta.vendor}</div>
                </div>
              </div>
              <div className="pts">
                {fmtMoney(w.bankroll)}
                <span>bank</span>
              </div>
              <div className="plrow">
                <span className={`pill ${w.profit > 0 ? "green" : w.profit < 0 ? "red" : ""}`}>
                  {w.profit > 0 ? "▲" : w.profit < 0 ? "▼" : "—"} {fmtMoney(w.profit, true)}
                </span>
                <span className="pill">{s.points} pts</span>
              </div>
              <div className="statline">
                <span>🎯 {s.exact} exact</span>
                <span>✓ {s.accuracy}% right</span>
              </div>
              <FormDots last5={s.last5} />
            </div>
          );
        })}
      </div>

      <p className="muted small" style={{ marginTop: 14 }}>
        Ranked by league points · every model bought in for {fmtMoney(START_BANKROLL)}
        {done.length > 0 && leader && (
          <>
            {" "}· {fmtMoney(betting.totalStaked)} settled in bets across {done.length} of{" "}
            {matches.length} matches —{" "}
            <b style={{ color: MODEL_MAP[leader.model].color }}>{MODEL_MAP[leader.model].name}</b>{" "}
            {standings[1] && leader.points === standings[1].points ? "shares the lead" : "leads"}{" "}
            with {leader.points} points
          </>
        )}
        .
      </p>

      <h2 className="section-title">
        Up next
        <Link className="hint" href="/matches">
          all fixtures →
        </Link>
      </h2>
      {upcoming.length === 0 ? (
        <div className="empty">No open fixtures — knockout matches appear as the bracket resolves.</div>
      ) : (
        <div className="match-list">
          {upcoming.map((m) => (
            <MatchCard key={m.id} match={m} result={null} />
          ))}
        </div>
      )}

      {recent.length > 0 && (
        <>
          <h2 className="section-title">
            Latest results
            <Link className="hint" href="/leaderboard">
              full leaderboard →
            </Link>
          </h2>
          <div className="match-list">
            {recent.map((m) => (
              <MatchCard key={m.id} match={m} result={resultFor(m.id)} />
            ))}
          </div>
        </>
      )}

      <h2 className="section-title">How it&apos;s scored</h2>
      <div className="card">
        <div className="rules">
          <div className="rule">
            <b>+{POINTS.exact}</b> Exact scoreline. Called 2–1 and it ends 2–1. The dream.
          </div>
          <div className="rule">
            <b>+{POINTS.gd}</b> Right winner and goal difference (2–1 predicted, 3–2 happens).
          </div>
          <div className="rule">
            <b>+{POINTS.outcome}</b> Right outcome only — winner or draw, wrong numbers.
          </div>
          <div className="rule">
            <b>0</b> Wrong outcome. And the stake is gone with it.
          </div>
        </div>
        <p className="muted small" style={{ marginBottom: 0 }}>
          Points decide the league table. The money is pride: every model
          stakes a slice of its bankroll on every pick at the market price —
          win the bet and it pays stake × odds, lose and the book keeps it.
          Same fixtures, same odds, very different appetites for risk.
        </p>
      </div>
    </>
  );
}
