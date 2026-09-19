import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer style={{ borderTop: "1px solid var(--line)", marginTop: 72, padding: "36px 0 44px", background: "var(--paper-2)" }}>
      <div className="wrap" style={{ display: "grid", gap: 26, gridTemplateColumns: "2fr 1fr 1fr" }}>
        <div className="small muted" style={{ maxWidth: 520 }}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "var(--ink)", marginBottom: 8 }}>FlightDelayCheck</p>
          <p>We sell a document, not representation. We are not a law firm, not a claims management company and not regulated by the FCA or SRA. Compensation under UK261 and EU261 can be claimed from the airline directly and free of charge; our letter is a convenience, not a requirement. We never contact the airline for you and we take no share of what you recover.</p>
          <p>Flight data by <a href="https://aerodatabox.com" rel="noopener">AeroDataBox</a>. Airport delay data: Eurocontrol Performance Review Unit. Weather: Iowa Environmental Mesonet METAR archive. None of these bodies endorses this site.</p>
        </div>
        <div className="small">
          <p className="eyebrow" style={{ marginBottom: 8 }}>Site</p>
          <p><Link href="/how-it-works">How it works</Link></p>
          <p><Link href="/your-rights">Your rights explained</Link></p>
          <p><Link href="/uk261-compensation">UK261</Link> · <Link href="/eu261-compensation">EU261</Link></p>
          <p><Link href="/flight-delay-compensation-calculator">Compensation calculator</Link></p>
          <p><Link href="/airlines">Airlines</Link></p>
          <p><Link href="/pricing">Pricing</Link></p>
          <p><Link href="/contact">Contact</Link></p>
        </div>
        <div className="small">
          <p className="eyebrow" style={{ marginBottom: 8 }}>Legal</p>
          <p><Link href="/terms">Terms</Link></p>
          <p><Link href="/privacy">Privacy</Link></p>
          <p><Link href="/refunds">Refunds and cancellation</Link></p>
          <p className="muted" style={{ marginTop: 10 }}>© {new Date().getFullYear()} FlightDelayCheck</p>
        </div>
      </div>
    </footer>
  );
}
