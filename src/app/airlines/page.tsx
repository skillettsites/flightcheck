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
      <h1 style={{ marginTop: 8 }}>Who covers what, airline by airline</h1>
      <p className="muted measure" style={{ fontSize: 18 }}>The airline&apos;s nationality decides whether your flight home is covered. Pick yours for the routes, the bands, the claim page and the escalation scheme.</p>
      {groups.map(([title, blurb, list]) => (
        <section key={title} style={{ marginTop: 32 }}>
          <h2>{title}</h2>
          <p className="muted small">{blurb}</p>
          <nav className="index" style={{ marginTop: 12 }} aria-label={title}>
            {list.map((a) => (
              <Link key={a.slug} href={`/airlines/${a.slug}`}>
                <strong>{a.name}</strong>
                <span>{a.code} · {a.hubs.slice(0, 2).join(", ")} · {a.adr === "CAA" ? "CAA" : a.adr}</span>
              </Link>
            ))}
          </nav>
        </section>
      ))}
    </div>
  );
}
