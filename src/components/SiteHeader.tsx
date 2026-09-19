import Link from "next/link";

const NAV: [string, string][] = [
  ["/watch", "Flight Watch"],
  ["/airlines", "Airlines"],
  ["/airport-delays", "Airport delays"],
  ["/flight-delay-compensation-calculator", "Calculator"],
  ["/your-rights", "Your rights"],
  ["/pricing", "Pricing"],
];

export default function SiteHeader() {
  return (
    <header style={{ background: "var(--paper)", borderBottom: "1.5px solid var(--ink)" }}>
      <div className="wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 64, gap: 20, flexWrap: "wrap", padding: "10px 22px" }}>
        <Link href="/" aria-label="FlightDelayCheck home" style={{ textDecoration: "none", display: "flex", alignItems: "baseline", gap: 12 }}>
          <span className="cond" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, lineHeight: 1 }}>
            Flight<span style={{ color: "var(--accent-ink)" }}>Delay</span>Check
          </span>
          <span className="eyebrow" style={{ display: "none" }} data-tag>UK261 · EU261</span>
        </Link>
        <nav aria-label="Main" className="nav">
          {NAV.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
      </div>
      <style>{`
        .nav { display: flex; gap: 4px 18px; flex-wrap: wrap; font-family: var(--font-mono); font-size: 12px; letter-spacing: .08em; text-transform: uppercase; }
        .nav a { text-decoration: none; color: var(--ink-2); padding: 4px 0; border-bottom: 1.5px solid transparent; }
        .nav a:hover { color: var(--ink); border-bottom-color: var(--accent); }
        @media (min-width: 900px) { [data-tag] { display: inline !important; } }
      `}</style>
    </header>
  );
}
