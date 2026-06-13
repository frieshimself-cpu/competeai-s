"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { fighter } from "@/lib/fighters";
import { EVENTS } from "@/lib/fixtures";
import { FightCard } from "@/components/FightCard";

type Filter = "all" | "upcoming" | "finished";

export default function FightsPage() {
  const { hydrated, fights, resultFor } = useStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [eventId, setEventId] = useState<string>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return fights.filter((f) => {
      if (filter === "upcoming" && resultFor(f.id)) return false;
      if (filter === "finished" && !resultFor(f.id)) return false;
      if (eventId !== "all" && f.eventId !== eventId) return false;
      if (q) {
        const hay = `${fighter(f.red).name} ${fighter(f.blue).name} ${f.weightClass}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [fights, filter, eventId, query, resultFor]);

  if (!hydrated)
    return (
      <div className="page-pad">
        <div className="skel">Loading the card…</div>
      </div>
    );

  // Group filtered fights under their event, events in display order, main event first.
  const groups = EVENTS.map((e) => ({
    event: e,
    fights: filtered
      .filter((f) => f.eventId === e.id)
      .sort((a, b) => a.order - b.order),
  })).filter((g) => g.fights.length > 0);

  return (
    <div className="page-pad">
      <div className="kicker">The card & the picks</div>
      <h1 className="page-title">Every fight, every call</h1>
      <p className="page-sub">
        All four models lock a winner, method and round for every bout, and
        back it at the moneyline. The picks you see are the picks they live
        (and pay) with.
      </p>

      <div className="filters">
        {(
          [
            ["all", "All"],
            ["upcoming", "Upcoming"],
            ["finished", "Finished"],
          ] as [Filter, string][]
        ).map(([f, label]) => (
          <button key={f} className={`fpill ${filter === f ? "on" : ""}`} onClick={() => setFilter(f)}>
            {label}
          </button>
        ))}
        <span style={{ width: 8 }} />
        <button
          className={`fpill ${eventId === "all" ? "on" : ""}`}
          onClick={() => setEventId("all")}
        >
          All events
        </button>
        {EVENTS.map((e) => (
          <button
            key={e.id}
            className={`fpill ${eventId === e.id ? "on" : ""}`}
            onClick={() => setEventId(e.id)}
          >
            {e.short}
          </button>
        ))}
        <input
          type="text"
          placeholder="Search fighter or weight…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ marginLeft: "auto", minWidth: 190 }}
        />
      </div>

      {groups.length === 0 ? (
        <div className="empty" style={{ marginTop: 24 }}>
          Nothing matches that filter.
        </div>
      ) : (
        groups.map(({ event, fights: evFights }) => (
          <div key={event.id}>
            <div className="day-h">
              {event.name} · {event.city}
            </div>
            <div className="match-list">
              {evFights.map((f) => (
                <FightCard key={f.id} fight={f} result={resultFor(f.id)} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
