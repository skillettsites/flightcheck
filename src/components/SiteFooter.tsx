import Link from "next/link";

export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer style={{ borderTop: "1.5px solid var(--ink)", marginTop: 80, padding: "30px 0 40px", background: "var(--paper)" }}>
      <div className="wrap foot">
        <div className="small" style={{ maxWidth: 560 }}>
          <p className="cond" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--ink)", marginBottom: 10 }}>Flight<span style={{ color: "var(--accent-ink)" }}>Delay</span>Check</p>
          <p className="muted">We sell a document, not representation. Not a law firm, not a claims management company, not regulated by the FCA or SRA. Compensation under UK261 and EU261 can be claimed from the airline directly and free of charge; the letter is a convenience, not a requirement. We never contact the airline for you and take no share of what you recover.</p>
        </div>
        <div>
          <p className="eyebrow" style={{ marginBottom: 10 }}>Check</p>
          <p><Link href="/">Free flight check</Link></p>
          <p><Link href="/watch">Flight Watch</Link></p>
          <p><Link href="/flight-delay-compensation-calculator">Compensation calculator</Link></p>
          <p><Link href="/how-it-works">How the check works</Link></p>
          <p><Link href="/pricing">Pricing</Link></p>
        </div>
        <div>
          <p className="eyebrow" style={{ marginBottom: 10 }}>Read</p>
          <p><Link href="/your-rights">Your rights, article by article</Link></p>
          <p><Link href="/uk261-compensation">UK261</Link> · <Link href="/eu261-compensation">EU261</Link></p>
          <p><Link href="/airlines">By airline</Link></p>
          <p><Link href="/airport-delays">Airport delay records</Link></p>
          <p><Link href="/contact">Contact</Link></p>
        </div>
        <div>
          <p className="eyebrow" style={{ marginBottom: 10 }}>Record</p>
          <p className="muted">Flight times: <a href="https://aerodatabox.com" rel="noopener">AeroDataBox</a></p>
          <p className="muted">Delay causes: Eurocontrol PRU, daily ATFM arrival delay</p>
          <p className="muted">Weather: METAR archive, Iowa Environmental Mesonet</p>
          <p className="muted">Airports: OurAirports. None of these bodies endorses this site.</p>
        </div>
      </div>
      <div className="wrap" style={{ marginTop: 26, paddingTop: 14, borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <p className="eyebrow" style={{ margin: 0 }}>© {year} FlightDelayCheck · England</p>
        <p className="eyebrow" style={{ margin: 0 }}><Link href="/terms" style={{ textDecoration: "none" }}>Terms</Link> · <Link href="/privacy" style={{ textDecoration: "none" }}>Privacy</Link> · <Link href="/refunds" style={{ textDecoration: "none" }}>Refunds</Link></p>
      </div>
      <style>{`
        .foot { display: grid; grid-template-columns: 1.6fr 1fr 1fr 1.1fr; gap: 28px; font-size: 14px; }
        .foot p { margin: 0 0 7px; }
        .foot a { text-decoration: none; }
        .foot a:hover { text-decoration: underline; text-underline-offset: 3px; }
        @media (max-width: 860px) { .foot { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 520px) { .foot { grid-template-columns: 1fr; } }
      `}</style>
    </footer>
  );
}
