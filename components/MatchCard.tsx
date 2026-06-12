"use client";

import { useState } from "react";
import { Match, ResultScore, STAGE_LABELS } from "@/lib/types";
import { team } from "@/lib/teams";
import { MODELS } from "@/lib/models";
import { predictionFor } from "@/lib/engine";
import { pointsFor } from "@/lib/scoring";
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
  const [open, setOpen] = useState(defaultOpen);
  const home = team(match.home);
  const away = team(match.away);
  const preds = MODELS.map((m) => ({
    meta: m,
    pred: predictionFor(match, m.id),
  }));

  return (
    <div className="match-card">
      <div className="match-head">
        <span className="pill">
          {match.stage === "group" ? `Group ${match.group}` : STAGE_LABELS[match.stage]}
        </span>
        <span>{fmtKickoff(match.kickoff)}</span>
        {match.city && <span>· {match.city}</span>}
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
            <>
              <span className="actual">
                {result.homeGoals}–{result.awayGoals}
              </span>
            </>
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
        {preds.map(({ meta, pred }) => (
          <div className="pred-chip" key={meta.id} title={`${meta.name}: ${pred.confidence}% confident`}>
            <ModelAvatar meta={meta} />
            <span className="ps">
              {pred.homeGoals}–{pred.awayGoals}
            </span>
            {result && (
              <span className={`earn ${earnClass(pointsFor(pred, result))}`}>
                +{pointsFor(pred, result)}
              </span>
            )}
          </div>
        ))}
      </div>

      {open && (
        <div className="reason-list">
          {preds.map(({ meta, pred }) => (
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
        {open ? "Hide the reasoning ↑" : "Why? Hear the models out ↓"}
      </button>
    </div>
  );
}
