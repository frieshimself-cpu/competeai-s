"use client";

import { Match, ModelId } from "@/lib/types";
import { MODELS } from "@/lib/models";

export function PointsChart({
  matches,
  series,
}: {
  matches: Match[];
  series: Record<ModelId, number[]>;
}) {
  const n = matches.length;
  if (n < 2) {
    return (
      <div className="empty">
        The race chart appears once at least two matches have results.
      </div>
    );
  }

  const W = Math.max(720, n * 26);
  const H = 280;
  const PAD = { l: 36, r: 64, t: 16, b: 28 };
  const maxY = Math.max(8, ...MODELS.map((m) => series[m.id][n - 1] ?? 0)) + 3;
  const x = (i: number) => PAD.l + (i / (n - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => H - PAD.b - (v / maxY) * (H - PAD.t - PAD.b);

  const yTicks: number[] = [];
  const step = maxY > 40 ? 10 : 5;
  for (let v = 0; v <= maxY; v += step) yTicks.push(v);

  return (
    <div className="card chart-wrap">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 560, display: "block" }}>
        {yTicks.map((v) => (
          <g key={v}>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={y(v)}
              y2={y(v)}
              stroke="rgba(255,255,255,0.07)"
            />
            <text x={PAD.l - 8} y={y(v) + 4} fontSize="10" fill="#5d6a82" textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        {MODELS.map((meta) => {
          const pts = series[meta.id];
          const d = pts.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");
          const last = pts[n - 1];
          return (
            <g key={meta.id}>
              <path d={d} fill="none" stroke={meta.color} strokeWidth="2.5" strokeLinejoin="round" />
              <circle cx={x(n - 1)} cy={y(last)} r="4" fill={meta.color} />
              <text
                x={x(n - 1) + 9}
                y={y(last) + 4}
                fontSize="11"
                fontWeight="700"
                fill={meta.color}
              >
                {meta.short} {last}
              </text>
            </g>
          );
        })}
        <text x={(W - PAD.r + PAD.l) / 2} y={H - 6} fontSize="10" fill="#5d6a82" textAnchor="middle">
          scored matches → (kickoff order)
        </text>
      </svg>
      <div className="legend">
        {MODELS.map((m) => (
          <span key={m.id}>
            <span className="dot" style={{ background: m.color }} />
            {m.name}
          </span>
        ))}
      </div>
    </div>
  );
}
