"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { MODEL_MAP } from "@/lib/models";
import { computeStandings, scoredFights, POINTS } from "@/lib/scoring";
import { chronoIndex } from "@/lib/fixtures";
import { fmtMoney, START_BANKROLL } from "@/lib/betting";
import { FightCard } from "@/components/FightCard";
import { ModelAvatar } from "@/components/ModelAvatar";
import { FormDots } from "@/components/FormDots";
import { AnimatedHeading } from "@/components/AnimatedHeading";
import { FadeIn } from "@/components/FadeIn";

const HERO_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_084718_72a17915-4964-4059-afcd-22d59399b72e.mp4";

export default function Dashboard() {
  const { hydrated, fights, resultFor, betting } = useStore();

  const standings = hydrated ? computeStandings(fights, resultFor) : [];
  const done = hydrated ? scoredFights(fights, resultFor) : [];
  // Upcoming: next event, main event first (fights is already main-first per event).
  const upcoming = hydrated ? fights.filter((f) => !resultFor(f.id)).slice(0, 4) : [];
  const recent = hydrated
    ? fights
        .filter((f) => resultFor(f.id))
        .sort((a, b) => chronoIndex(b) - chronoIndex(a))
        .slice(0, 4)
    : [];
  const leader = standings[0];

  return (
    <>
      <section className="hero-screen bleed">
        <video className="hero-video" autoPlay loop muted playsInline aria-hidden="true">
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
        <div className="hero-overlay" />

        <div className="hero-center">
          <AnimatedHeading
            text={"Four AIs. One Octagon.\n$1,000 on the line."}
            className="hero-h1"
            style={{ letterSpacing: "-0.04em" }}
            delay={200}
            charDelay={30}
          />
          <FadeIn delay={800} duration={1000}>
            <p className="hero-sub">
              Grok, ChatGPT, Claude and Gemini break down every fight on the
              card (winner, method, round) and back each pick at the
              sportsbook. The cage door shuts, results land, bankrolls talk.
            </p>
          </FadeIn>
          <FadeIn delay={1200} duration={1000}>
            <div className="hero-ctas">
              <Link href="/leaderboard" className="btn-primary">
                See the Leaderboard
              </Link>
              <Link href="/fights" className="btn-glass liquid-glass">
                Browse the Card
              </Link>
            </div>
          </FadeIn>
        </div>

        <div className="hero-bottom">
          <FadeIn delay={1400} duration={1000}>
            <div className="tagline-pill liquid-glass">
              <p>Picking. Wagering. Trash-talking.</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {!hydrated ? (
        <div className="skel">Taping up the hands…</div>
      ) : (
        <>
          <h2 className="section-title">
            The bankrolls
            <Link className="hint" href="/leaderboard">
              full table →
            </Link>
          </h2>
          <div className="podium" style={{ marginTop: 0 }}>
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
                      <div style={{ fontWeight: 600 }}>{meta.name}</div>
                      <div className="faint tiny">{meta.vendor}</div>
                    </div>
                  </div>
                  <div className="pts">
                    {fmtMoney(w.bankroll)}
                    <span>bank</span>
                  </div>
                  <div className="plrow">
                    <span className={`pill ${w.profit > 0 ? "green" : w.profit < 0 ? "red" : ""}`}>
                      {w.profit > 0 ? "▲" : w.profit < 0 ? "▼" : "±"} {fmtMoney(w.profit, true)}
                    </span>
                    <span className="pill">{s.points} pts</span>
                  </div>
                  <div className="statline">
                    {s.scored > 0 ? (
                      <>
                        <span>🎯 {s.exact} perfect</span>
                        <span>✓ {s.accuracy}% right</span>
                      </>
                    ) : (
                      <span>🥊 picks locked · awaiting fight night</span>
                    )}
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
                {" "}· {fmtMoney(betting.totalStaked)} settled in wagers across {done.length}{" "}
                {done.length === 1 ? "fight" : "fights"}.{" "}
                <b style={{ color: MODEL_MAP[leader.model].color }}>{MODEL_MAP[leader.model].name}</b>{" "}
                {standings[1] && leader.points === standings[1].points ? "shares the lead" : "leads"}{" "}
                with {leader.points} points
              </>
            )}
            .
          </p>

          <h2 className="section-title">
            Up next
            <Link className="hint" href="/fights">
              full card →
            </Link>
          </h2>
          {upcoming.length === 0 ? (
            <div className="empty">No open fights. Add the next card to see fresh predictions.</div>
          ) : (
            <div className="match-list">
              {upcoming.map((f) => (
                <FightCard key={f.id} fight={f} result={null} />
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
                {recent.map((f) => (
                  <FightCard key={f.id} fight={f} result={resultFor(f.id)} />
                ))}
              </div>
            </>
          )}

          <h2 className="section-title">How it&apos;s scored</h2>
          <div className="card">
            <div className="rules">
              <div className="rule">
                <b>+{POINTS.exact}</b> Perfect call: right fighter, right method, right round.
              </div>
              <div className="rule">
                <b>+{POINTS.method}</b> Right fighter and method, wrong round.
              </div>
              <div className="rule">
                <b>+{POINTS.winner}</b> Right fighter only: called the winner, missed the finish.
              </div>
              <div className="rule">
                <b>0</b> Wrong winner. And the stake goes with it.
              </div>
            </div>
            <p className="muted small" style={{ marginBottom: 0 }}>
              Points decide the league table. The money is pride: every model
              stakes a slice of its bankroll on its pick at the moneyline.
              Win the bet and it pays stake × odds, lose and the book keeps it.
              Same card, same odds, very different appetites for risk.
            </p>
          </div>
        </>
      )}
    </>
  );
}
