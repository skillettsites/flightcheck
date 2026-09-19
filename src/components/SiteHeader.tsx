import Link from "next/link";

export default function SiteHeader() {
  return (
    <header style={{ borderBottom: "1px solid var(--line)", background: "var(--paper-2)" }}>
      <div className="wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 62, gap: 16 }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }} aria-label="FlightDelayCheck home">
          <span aria-hidden style={{ display: "inline-block", width: 28, height: 28, borderRadius: 6, background: "var(--board)", position: "relative" }}>
            <span style={{ position: "absolute", left: 6, right: 6, top: 12, height: 4, background: "var(--flap)", borderRadius: 2 }} />
            <span style={{ position: "absolute", left: 6, width: 8, top: 6, height: 4, background: "var(--flap)", borderRadius: 2, opacity: .6 }} />
            <span style={{ position: "absolute", right: 6, width: 8, top: 18, height: 4, background: "var(--flap)", borderRadius: 2, opacity: .6 }} />
          </span>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 19, letterSpacing: "-0.01em" }}>FlightDelayCheck</span>
        </Link>
        <nav aria-label="Main" style={{ display: "flex", gap: 18, fontSize: 14.5, fontWeight: 600 }}>
          <Link href="/watch" style={{ textDecoration: "none", color: "var(--ink-2)" }}>Flight Watch</Link>
          <Link href="/airlines" style={{ textDecoration: "none", color: "var(--ink-2)" }}>Airlines</Link>
          <Link href="/airport-delays" style={{ textDecoration: "none", color: "var(--ink-2)" }}>Airport delays</Link>
          <Link href="/flight-delay-compensation-calculator" style={{ textDecoration: "none", color: "var(--ink-2)" }}>Calculator</Link>
          <Link href="/how-it-works" style={{ textDecoration: "none", color: "var(--ink-2)" }}>How it works</Link>
          <Link href="/your-rights" style={{ textDecoration: "none", color: "var(--ink-2)" }}>Your rights</Link>
          <Link href="/pricing" style={{ textDecoration: "none", color: "var(--ink-2)" }}>Pricing</Link>
        </nav>
      </div>
    </header>
  );
}
