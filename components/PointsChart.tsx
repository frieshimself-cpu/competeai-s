"use client";

import { ModelId } from "@/lib/types";
import { MODELS } from "@/lib/models";

function niceStep(raw: number): number {
  const pow = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1))));
  for (const m of [1, 2, 2.5, 5, 10]) {
    if (pow * m >= raw) return pow * m;
  }
  return pow * 10;
}

export function RaceChart({
  count,
  series,
  fmt,
  baseline,
  zeroFloor = false,
  caption,
}: {
  count: number; // number of settled matches (x axis)
  series: Record<ModelId, number[]>;
  fmt: (v: number) => string;
  baseline?: number; // dashed reference line (e.g. the $1,000 buy-in)
  zeroFloor?: boolean;
  caption: string;
}) {
  if (count < 2) {
    return (
      <div className="empty">
        The race chart appears once at least two matches have results.
      </div>
    );
  }

  const all = MODELS.flatMap((m) => series[m.id]);
  if (baseline !== undefined) all.push(baseline);
  const rawMax = Math.max(...all);
  const rawMin = zeroFloor ? 0 : Math.min(...all);
  const pad = Math.max((rawMax - rawMin) * 0.12, 2);
  const maxY = rawMax + pad;
  const minY = zeroFloor ? 0 : Math.max(0, rawMin - pad);

  const W = Math.max(720, count * 26);
  const H = 280;
  const PAD = { l: 56, r: 96, t: 16, b: 28 };
  const x = (i: number) => PAD.l + (i / (count - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) =>
    H - PAD.b - ((v - minY) / (maxY - minY)) * (H - PAD.t - PAD.b);

  const step = niceStep((maxY - minY) / 4);
  const ticks: number[] = [];
  for (let v = Math.ceil(minY / step) * step; v <= maxY; v += step) ticks.push(v);

  return (
    <div className="card chart-wrap">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 560, display: "block" }}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,0.07)" />
            <text x={PAD.l - 8} y={y(v) + 4} fontSize="10" fill="#5d6a82" textAnchor="end">
              {fmt(v)}
            </text>
          </g>
        ))}
        {baseline !== undefined && (
          <g>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={y(baseline)}
              y2={y(baseline)}
              stroke="rgba(242,193,78,0.45)"
              strokeDasharray="5 5"
            />
            <text x={W - PAD.r + 6} y={y(baseline) + 4} fontSize="9" fill="#f2c14e">
              buy-in {fmt(baseline)}
            </text>
          </g>
        )}
        {MODELS.map((meta) => {
          const pts = series[meta.id];
          const d = pts.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");
          const last = pts[count - 1];
          return (
            <g key={meta.id}>
              <path d={d} fill="none" stroke={meta.color} strokeWidth="2.5" strokeLinejoin="round" />
              <circle cx={x(count - 1)} cy={y(last)} r="4" fill={meta.color} />
              <text
                x={x(count - 1) + 9}
                y={y(last) + 4}
                fontSize="11"
                fontWeight="700"
                fill={meta.color}
              >
                {meta.short} {fmt(last)}
              </text>
            </g>
          );
        })}
        <text x={(W - PAD.r + PAD.l) / 2} y={H - 6} fontSize="10" fill="#5d6a82" textAnchor="middle">
          {caption}
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
