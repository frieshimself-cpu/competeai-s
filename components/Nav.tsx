"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ContractBar } from "./ContractBar";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/fights", label: "Fights" },
  { href: "/models", label: "The Models" },
];

export function Nav() {
  const path = usePathname();
  return (
    <header className="navwrap">
      <nav className="glassbar liquid-glass">
        <Link href="/" className="brand">
          AI Fight League<span className="brand-sub">UFC</span>
        </Link>
        <div className="navlinks">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={path === l.href ? "active" : ""}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="nav-right">
          <ContractBar variant="nav" />
          <Link href="/leaderboard" className="btn-primary nav-cta">
            Leaderboard
          </Link>
        </div>
      </nav>
    </header>
  );
}
