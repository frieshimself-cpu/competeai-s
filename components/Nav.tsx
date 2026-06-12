"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/matches", label: "Matches" },
  { href: "/models", label: "The Models" },
];

export function Nav() {
  const path = usePathname();
  return (
    <header className="navwrap">
      <nav className="glassbar liquid-glass">
        <Link href="/" className="brand">
          CompeteAI<span className="brand-sub">WORLD CUP 26</span>
        </Link>
        <div className="navlinks">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={path === l.href ? "active" : ""}>
              {l.label}
            </Link>
          ))}
        </div>
        <Link href="/leaderboard" className="btn-primary nav-cta">
          Leaderboard
        </Link>
      </nav>
    </header>
  );
}
