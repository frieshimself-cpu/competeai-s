"use client";

import { useState } from "react";
import { Fight, FightResult, METHOD_SHORT } from "@/lib/types";
import { fighter } from "@/lib/fighters";
import { getEvent } from "@/lib/fixtures";
import { MODELS } from "@/lib/models";
import { predictionFor, pickShort, describePrediction } from "@/lib/engine";
import { pointsFor } from "@/lib/scoring";
import { americanOdds, betFor, cornerName, fmtMoney, marketOdds } from "@/lib/betting";
import { useStore } from "@/lib/store";
import { ModelAvatar } from "./ModelAvatar";

export function fightWhen(fight: Fight): string {
  const e = getEvent(fight.eventId);
  if (!e) return "";
  const d = new Date(`${e.date}T00:00:00`);
  const date = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${e.short} · ${date}`;
}

function earnClass(pts: number): string {
  if (pts === 5) return "e5";
  if (pts === 3) return "e3";
  if (pts === 2) return "e2";
  return "e0";
}

function resultLabel(r: FightResult): string {
  return r.method === "DEC" ? "DEC" : `${METHOD_SHORT[r.method]} R${r.round}`;
}

export function FightCard({
  fight,
  result,
  defaultOpen = false,
}: {
  fight: Fight;
  result: FightResult | null;
  defaultOpen?: boolean;
}) {
  const { betting } = useStore();
  const [open, setOpen] = useState(defaultOpen);
  const red = fighter(fight.red);
  const blue = fighter(fight.blue);
  const odds = marketOdds(fight);
  const preds = MODELS.map((m) => ({
    meta: m,
    pred: predictionFor(fight, m.id),
    bet: betFor(betting, fight.id, m.id),
  }));

  const redWon = result?.winner === "R";
  const blueWon = result?.winner === "B";

  return (
    <div className="match-card">
      <div className="match-head">
        <span className="pill">{fight.slot}</span>
        <span>{fight.weightClass}</span>
        {fight.title && <span className="pill belt">🏆 Title</span>}
        <span>· {fight.rounds} rounds</span>
        <span className="pill odds" title={`Moneyline: ${red.name} / ${blue.name}`}>
          {red.short} {americanOdds(odds.R)} · {blue.short} {americanOdds(odds.B)}
        </span>
        {result ? (
          <span className="pill green" style={{ marginLeft: "auto" }}>
            RESULT
          </span>
        ) : (
          <span className="pill" style={{ marginLeft: "auto" }}>
            {fightWhen(fight)}
          </span>
        )}
      </div>

      <div className="match-teams">
        <div className={`team ${redWon ? "win" : result ? "lose" : ""}`}>
          <span className="flag">{red.flag}</span>
          <span className="fighter">
            <span className="nm">{red.name}</span>
            <span className="rec">{red.record}</span>
          </span>
        </div>
        <div className="score-box">
          {result ? (
            <>
              <span className="actual">{resultLabel(result)}</span>
              <span className="ft">
                {result.winner === "D" ? "DRAW" : `${(result.winner === "R" ? red : blue).short} WINS`}
              </span>
            </>
          ) : (
            <span className="vs">VS</span>
          )}
        </div>
        <div className={`team right ${blueWon ? "win" : result ? "lose" : ""}`}>
          <span className="fighter">
            <span className="nm">{blue.name}</span>
            <span className="rec">{blue.record}</span>
          </span>
          <span className="flag">{blue.flag}</span>
        </div>
      </div>

      <div className="pred-row">
        {preds.map(({ meta, pred, bet }) => (
          <div
            className="pred-chip"
            key={meta.id}
            title={`${meta.name}: ${describePrediction(fight, pred)} · ${pred.confidence}% confident`}
          >
            <ModelAvatar meta={meta} />
            <span className="ps">{pickShort(fight, pred)}</span>
            <span className="chip-right">
              {bet && bet.status === "pending" && <span className="mny">{fmtMoney(bet.stake)}</span>}
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
                    {describePrediction(fight, pred)} · {pred.confidence}% confident
                  </span>
                </div>
                <div className="txt">“{pred.reasoning}”</div>
                {bet && (
                  <div
                    className={`bet-line ${bet.status === "won" ? "up" : bet.status === "lost" ? "down" : ""}`}
                  >
                    💵 {fmtMoney(bet.stake)} on {cornerName(fight, bet.pick, (c) => fighter(c).name)} @{" "}
                    {americanOdds(bet.odds)}
                    {bet.status === "pending" && <>, pays {fmtMoney(bet.stake + bet.toWin)} if it lands</>}
                    {bet.status === "won" && <>, cashed {fmtMoney(bet.profit, true)}</>}
                    {bet.status === "lost" && <>, {fmtMoney(bet.stake)} torched</>}
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
        {open ? "Hide the breakdown ↑" : "The breakdown & the wagers ↓"}
      </button>
    </div>
  );
}
