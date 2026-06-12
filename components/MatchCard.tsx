"use client";

import { useState } from "react";
import { Match, ResultScore, STAGE_LABELS } from "@/lib/types";
import { team } from "@/lib/teams";
import { MODELS } from "@/lib/models";
import { predictionFor } from "@/lib/engine";
import { pointsFor } from "@/lib/scoring";
import { betFor, fmtMoney, marketOdds, pickLabel } from "@/lib/betting";
import { useStore } from "@/lib/store";
import { ModelAvatar } from "./ModelAvatar";

export function fmtKickoff(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function earnClass(pts: number): string {
  if (pts === 5) return "e5";
  if (pts === 3) return "e3";
  if (pts === 2) return "e2";
  return "e0";
}

export function MatchCard({
  match,
  result,
  defaultOpen = false,
}: {
  match: Match;
  result: ResultScore | null;
  defaultOpen?: boolean;
}) {
  const { betting } = useStore();
  const [open, setOpen] = useState(defaultOpen);
  const home = team(match.home);
  const away = team(match.away);
  const odds = marketOdds(match);
  const preds = MODELS.map((m) => ({
    meta: m,
    pred: predictionFor(match, m.id),
    bet: betFor(betting, match.id, m.id),
  }));

  return (
    <div className="match-card">
      <div className="match-head">
        <span className="pill">
          {match.stage === "group" ? `Group ${match.group}` : STAGE_LABELS[match.stage]}
        </span>
        <span>{fmtKickoff(match.kickoff)}</span>
        {match.city && <span>· {match.city}</span>}
        <span className="pill odds" title={`Market odds — ${home.name} / draw / ${away.name}`}>
          {odds.H.toFixed(2)} · {odds.D.toFixed(2)} · {odds.A.toFixed(2)}
        </span>
        {result && (
          <span className="pill green" style={{ marginLeft: "auto" }}>
            FULL TIME
          </span>
        )}
      </div>

      <div className="match-teams">
        <div className="team">
          <span className="flag">{home.flag}</span>
          <span className="nm">{home.name}</span>
        </div>
        <div className="score-box">
          {result ? (
            <span className="actual">
              {result.homeGoals}–{result.awayGoals}
            </span>
          ) : (
            <span className="vs">VS</span>
          )}
        </div>
        <div className="team right">
          <span className="nm">{away.name}</span>
          <span className="flag">{away.flag}</span>
        </div>
      </div>

      <div className="pred-row">
        {preds.map(({ meta, pred, bet }) => (
          <div
            className="pred-chip"
            key={meta.id}
            title={
              bet
                ? `${meta.name}: ${pred.homeGoals}–${pred.awayGoals}, ${fmtMoney(bet.stake)} riding at ${bet.odds.toFixed(2)}`
                : `${meta.name}: ${pred.homeGoals}–${pred.awayGoals}`
            }
          >
            <ModelAvatar meta={meta} />
            <span className="ps">
              {pred.homeGoals}–{pred.awayGoals}
            </span>
            <span className="chip-right">
              {bet && bet.status === "pending" && (
                <span className="mny">{fmtMoney(bet.stake)}</span>
              )}
              {bet && bet.status !== "pending" && (
                <span className={`mny ${bet.profit >= 0 ? "up" : "down"}`}>
                  {fmtMoney(bet.profit, true)}
                </span>
              )}
              {result && (
                <span className={`earn ${earnClass(pointsFor(pred, result))}`}>
                  +{pointsFor(pred, result)}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      {open && (
        <div className="reason-list">
          {preds.map(({ meta, pred, bet }) => (
            <div className="reason" key={meta.id}>
              <ModelAvatar meta={meta} size="md" />
              <div style={{ flex: 1 }}>
                <div className="who">
                  {meta.name}
                  <span className="faint tiny" style={{ fontWeight: 600 }}>
                    picks {pred.homeGoals}–{pred.awayGoals} · {pred.confidence}% confident
                  </span>
                </div>
                <div className="txt">“{pred.reasoning}”</div>
                {bet && (
                  <div
                    className={`bet-line ${bet.status === "won" ? "up" : bet.status === "lost" ? "down" : ""}`}
                  >
                    💵 {fmtMoney(bet.stake)} on {pickLabel(match, bet.pick, (c) => team(c).name)} @{" "}
                    {bet.odds.toFixed(2)}
                    {bet.status === "pending" && <> — pays {fmtMoney(bet.stake + bet.toWin)} if it lands</>}
                    {bet.status === "won" && <> — cashed {fmtMoney(bet.profit, true)}</>}
                    {bet.status === "lost" && <> — {fmtMoney(bet.stake)} torched</>}
                  </div>
                )}
                <div className="conf-bar">
                  <div
                    style={{
                      width: `${pred.confidence}%`,
                      background: `linear-gradient(90deg, ${meta.color}, ${meta.color2})`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="expand-btn" onClick={() => setOpen(!open)}>
        {open ? "Hide the reasoning ↑" : "The reasoning & the wagers ↓"}
      </button>
    </div>
  );
}
