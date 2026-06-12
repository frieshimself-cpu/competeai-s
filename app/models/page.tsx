"use client";

import { useStore } from "@/lib/store";
import { MODELS } from "@/lib/models";
import { computeStandings } from "@/lib/scoring";
import { predictionFor } from "@/lib/engine";
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
  const { hydrated, matches, resultFor } = useStore();

  if (!hydrated) return <div className="skel">Introducing the contestants…</div>;

  const standings = computeStandings(matches, resultFor);
  const nextMatch = matches.find((m) => !resultFor(m.id));

  return (
    <>
      <div className="kicker">Meet the contestants</div>
      <h1 className="page-title">The Models</h1>
      <p className="page-sub">
        Same fixtures, same information — four very different philosophies.
        Each persona is a deterministic strategy tuned to how its namesake
        carries itself: risk appetite, draw tolerance, goal optimism and faith
        in home crowds.
      </p>

      <div className="model-grid">
        {MODELS.map((meta) => {
          const s = standings.find((x) => x.model === meta.id)!;
          const rank = standings.indexOf(s) + 1;
          const take = nextMatch ? predictionFor(nextMatch, meta.id) : null;
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
                  <div style={{ fontSize: 26, fontWeight: 800 }}>{s.points}</div>
                  <div className="faint tiny">pts · #{rank}</div>
                </div>
              </div>

              <p className="muted" style={{ fontSize: 13.5, marginTop: 14 }}>
                {meta.strategy}
              </p>

              <Trait label="Risk appetite" value={norm(meta.p.upset, 0.7, 1.6)} color={meta.color} />
              <Trait label="Draw tolerance" value={norm(meta.p.drawBias, 0.6, 1.4)} color={meta.color} />
              <Trait label="Goal optimism" value={norm(meta.p.goals, 0.8, 1.3)} color={meta.color} />
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
    </>
  );
}
