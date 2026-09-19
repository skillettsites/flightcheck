"use client";

import Link from "next/link";
import { useState } from "react";

const NAV: [string, string][] = [
  ["/how-it-works", "How it works"],
  ["/airlines", "Airlines"],
  ["/pricing", "Pricing"],
];

const MORE: [string, string][] = [
  ["/watch", "Flight Watch"],
  ["/airport-delays", "Airport delays"],
  ["/flight-delay-compensation-calculator", "Calculator"],
  ["/your-rights", "Your rights"],
];

function Mark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3.5 12.5 21 4.5l-6.2 16.2-2.6-6.2L3.5 12.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className={`site-header${open ? " is-open" : ""}`}>
      <div className="wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 72, gap: 16 }}>
        <Link href="/" aria-label="FlightDelayCheck home" className="brand" onClick={() => setOpen(false)}>
          <Mark />
          FlightDelayCheck
        </Link>
        <nav aria-label="Main" className="nav-desktop">
          {NAV.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
          <Link href="/#check" className="btn btn-accent nav-cta">Check a flight</Link>
        </nav>
        <button type="button" className="nav-toggle" aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((v) => !v)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            {open
              ? <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              : <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}
          </svg>
        </button>
      </div>
      <div className="nav-panel wrap" id="site-menu">
        {[...NAV, ...MORE].map(([href, label]) => (
          <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>
        ))}
        <Link href="/#check" className="btn btn-accent" style={{ marginTop: 8, width: "100%" }} onClick={() => setOpen(false)}>Check a flight</Link>
      </div>
    </header>
  );
}
