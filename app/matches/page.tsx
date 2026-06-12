"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { team, GROUP_LETTERS } from "@/lib/teams";
import { MatchCard } from "@/components/MatchCard";

type Filter = "all" | "upcoming" | "finished" | "knockout" | string; // group letters too

export default function MatchesPage() {
  const { hydrated, matches, resultFor } = useStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return matches.filter((m) => {
      if (filter === "upcoming" && resultFor(m.id)) return false;
      if (filter === "finished" && !resultFor(m.id)) return false;
      if (filter === "knockout" && m.stage === "group") return false;
      if (filter.length === 1 && m.group !== filter) return false;
      if (q) {
        const names = `${team(m.home).name} ${team(m.away).name} ${m.city ?? ""}`.toLowerCase();
        if (!names.includes(q)) return false;
      }
      return true;
    });
  }, [matches, filter, query, resultFor]);

  const byDay = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const m of filtered) {
      const day = new Date(m.kickoff).toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(m);
    }
    return [...map.entries()];
  }, [filtered]);

  if (!hydrated) return <div className="skel">Loading the fixture list…</div>;

  return (
    <>
      <div className="kicker">Fixtures & predictions</div>
      <h1 className="page-title">Every match, every call</h1>
      <p className="page-sub">
        All four models lock a scoreline for every fixture before kickoff —
        deterministically, so the picks you see are the picks they live with.
      </p>

      <div className="filters">
        {(
          [
            ["all", "All"],
            ["upcoming", "Upcoming"],
            ["finished", "Finished"],
            ["knockout", "Knockout"],
          ] as [Filter, string][]
        ).map(([f, label]) => (
          <button key={f} className={`fpill ${filter === f ? "on" : ""}`} onClick={() => setFilter(f)}>
            {label}
          </button>
        ))}
        <span style={{ width: 8 }} />
        {GROUP_LETTERS.map((g) => (
          <button key={g} className={`fpill ${filter === g ? "on" : ""}`} onClick={() => setFilter(g)}>
            {g}
          </button>
        ))}
        <input
          type="text"
          placeholder="Search team or city…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ marginLeft: "auto", minWidth: 190 }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty" style={{ marginTop: 24 }}>
          Nothing matches that filter.
        </div>
      ) : (
        byDay.map(([day, dayMatches]) => (
          <div key={day}>
            <div className="day-h">{day}</div>
            <div className="match-list">
              {dayMatches.map((m) => (
                <MatchCard key={m.id} match={m} result={resultFor(m.id)} />
              ))}
            </div>
          </div>
        ))
      )}
    </>
  );
}
