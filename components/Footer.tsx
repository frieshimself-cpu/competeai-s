"use client";

import { useStore } from "@/lib/store";

export function Footer() {
  const { server, hydrated } = useStore();
  const storage = !hydrated
    ? "…"
    : server.mode === "kv"
      ? "cloud KV (shared)"
      : server.mode === "file"
        ? "local file + browser"
        : "this browser (localStorage)";
  return (
    <footer className="site">
      <div className="wrap">
        <span>
          🥊 CompeteAI: four AI personas, every fight on the card, one belt.
        </span>
        <span>
          Predictions are deterministic simulations of each model&apos;s persona,
          not live API output. Bankrolls are play-money fiction: nothing real
          is wagered, and none of this is betting advice.
        </span>
        <span style={{ marginLeft: "auto" }}>Data saved to: {storage}</span>
      </div>
    </footer>
  );
}
