import type { Metadata } from "next";
import Link from "next/link";
import { AIRLINE_PAGES } from "@/data/airline-pages";

export const metadata: Metadata = {
  title: "Flight delay compensation by airline",
  description: "How UK261 and EU261 apply to easyJet, Ryanair, British Airways, Jet2, TUI, Wizz Air, Virgin Atlantic, Aer Lingus and more: which flights are covered, how much, where to claim and where to escalate.",
};

export default function Airlines() {
  const groups: [string, string, typeof AIRLINE_PAGES][] = [
    ["UK carriers", "Covered on every flight out of the UK and every flight into the UK.", AIRLINE_PAGES.filter((a) => a.carrierType === "uk")],
    ["EU carriers", "Covered out of the UK or EU, and into the UK from the EU (both regulations) or into the EU from anywhere.", AIRLINE_PAGES.filter((a) => a.carrierType === "eu")],
    ["Other carriers", "Covered only on flights departing the UK or the EU. The return leg is not.", AIRLINE_PAGES.filter((a) => a.carrierType === "third")],
  ];
  return (
    <div className="wrap" style={{ paddingTop: 40, paddingBottom: 40 }}>
      <p className="eyebrow">Airlines</p>
      <h1 style={{ fontSize: "clamp(30px,4.5vw,44px)", marginTop: 8 }}>Who covers what, airline by airline</h1>
      <p className="muted measure" style={{ fontSize: 18 }}>The airline&apos;s nationality decides whether your flight home is covered. Pick yours for the routes, the bands, the claim page and the escalation scheme.</p>
      {groups.map(([title, blurb, list]) => (
        <section key={title} style={{ marginTop: 32 }}>
          <h2>{title}</h2>
          <p className="muted small">{blurb}</p>
          <div className="grid-3" style={{ marginTop: 12 }}>
            {list.map((a) => (
              <Link key={a.slug} href={`/airlines/${a.slug}`} className="card" style={{ textDecoration: "none", display: "grid", gap: 6 }}>
                <span style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}><strong style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>{a.name}</strong><span className="mono muted small">{a.code}</span></span>
                <span className="small muted">{a.hubs.slice(0, 3).join(", ")}</span>
                <span className="small">Escalation: {a.adr === "CAA" ? "CAA" : a.adr}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
