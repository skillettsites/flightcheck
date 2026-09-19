import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AIRLINE_PAGES, airlinePageBySlug } from "@/data/airline-pages";
import CheckForm from "@/components/CheckForm";
import JsonLd, { breadcrumbSchema, faqSchema } from "@/components/JsonLd";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://flightdelaycheck.co.uk";

export function generateStaticParams() {
  return AIRLINE_PAGES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = airlinePageBySlug(slug);
  if (!a) return {};
  const top = a.typicalRoutes.filter((r) => !r.band.startsWith("not")).map((r) => r.band).filter((v, i, s) => s.indexOf(v) === i).join(", ");
  return {
    title: `${a.name} delay compensation: check your flight, claim ${top}`,
    description: `Was your ${a.shortName} flight delayed 3 hours or cancelled? Check it against the flight record and the airport delay data for that day, free. ${a.carrierType === "third" ? `Only flights departing the UK or EU are covered on ${a.shortName}.` : `${a.shortName} is a ${a.carrierType === "uk" ? "UK" : "EU"} carrier, so inbound flights are covered too.`} Claim letter £4.99, no percentage fees.`,
    alternates: { canonical: `${SITE}/airlines/${a.slug}` },
  };
}

export default async function AirlinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = airlinePageBySlug(slug);
  if (!a) notFound();
  const others = AIRLINE_PAGES.filter((x) => x.slug !== a.slug).slice(0, 8);
  const carrierLine =
    a.carrierType === "uk" ? `${a.name} is a UK carrier. Flights out of the UK are covered by UK261 whatever the destination, and flights into the UK are covered too, from anywhere in the world.` :
    a.carrierType === "eu" ? `${a.name} is an EU carrier. Flights out of the UK are covered by UK261; flights out of the EU by EU261; flights from the EU into the UK by both, and you choose which to claim under.` :
    `${a.name} is not a UK or EU carrier. Only flights departing a UK or EU airport are covered; the return leg from ${a.hubs[0]} is not.`;

  return (
    <div className="wrap" style={{ paddingTop: 32, paddingBottom: 40 }}>
      <JsonLd data={[faqSchema(a.faqs), breadcrumbSchema([{ name: "Home", url: SITE }, { name: "Airlines", url: `${SITE}/airlines` }, { name: a.name, url: `${SITE}/airlines/${a.slug}` }])]} />
      <p className="eyebrow"><Link href="/airlines" style={{ textDecoration: "none" }}>Airlines</Link> · {a.code}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 36, alignItems: "start", marginTop: 8 }} className="hero">
        <div>
          <h1>{a.name} delay compensation: check your flight against the record</h1>
          <p className="muted" style={{ fontSize: 18, marginTop: 14 }}>{carrierLine}</p>
          <p className="muted">Enter the flight number and date. We pull the actual arrival time, the Eurocontrol air-traffic delay logged at both airports that day and the airport weather, then tell you whether {a.shortName} owes you £220, £350 or £520 per passenger and how strong the airline&apos;s likely defence is.</p>
        </div>
        <CheckForm />
      </div>

      <section style={{ marginTop: 40 }} className="grid-2">
        <div className="card">
          <p className="eyebrow">Typical {a.shortName} routes</p>
          <table className="tbl" style={{ marginTop: 8 }}>
            <thead><tr><th>Route</th><th>Distance</th><th>Per passenger</th></tr></thead>
            <tbody>{a.typicalRoutes.map((r) => <tr key={r.from + r.to}><td>{r.from} to {r.to}</td><td className="mono">{r.km.toLocaleString()} km</td><td className="mono">{r.band}</td></tr>)}</tbody>
          </table>
          <p className="small muted" style={{ marginTop: 8 }}>Bands: up to 1,500 km £220 / €250; 1,500 to 3,500 km £350 / €400; over 3,500 km £520 / €600 (halved for a 3 to 4 hour long-haul delay).</p>
        </div>
        <div className="card">
          <p className="eyebrow">What to know about claiming from {a.shortName}</p>
          <ul className="small" style={{ paddingLeft: 18, display: "grid", gap: 8, marginTop: 8, color: "var(--ink-2)" }}>{a.notes.map((n) => <li key={n}>{n}</li>)}</ul>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <a className="btn btn-ghost" href={a.claimUrl} target="_blank" rel="noopener">{a.shortName}&apos;s claim page</a>
            <a className="btn btn-ghost" href={a.adr === "CEDR" ? "https://www.cedr.com/consumer/aviation/" : a.adr === "AviationADR" ? "https://www.aviationadr.org.uk/" : "https://www.caa.co.uk/passengers/"} target="_blank" rel="noopener">{a.adr === "CAA" ? "CAA complaints" : a.adr} (free escalation)</a>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 40, maxWidth: 820 }}>
        <p className="eyebrow">{a.shortName} compensation questions</p>
        <h2 style={{ margin: "8px 0 10px" }}>Answers people search for</h2>
        {a.faqs.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
      </section>

      <section style={{ marginTop: 36 }}>
        <div className="honest measure">
          <p style={{ margin: 0, fontWeight: 600 }}>You can claim from {a.shortName} for free.</p>
          <p className="small" style={{ margin: "6px 0 0" }}>Use the claim page above and a free template from the CAA, Which? or MoneySavingExpert. Our £4.99 letter adds the verified flight record and the day&apos;s delay and weather evidence, which is what you will need if {a.shortName} replies with &ldquo;extraordinary circumstances&rdquo;. Claims firms charge 35% to 50% of the payout for the same claim.</p>
        </div>
      </section>

      <section style={{ marginTop: 36 }}>
        <p className="eyebrow">Other airlines</p>
        <p className="small" style={{ display: "flex", flexWrap: "wrap", gap: "8px 18px", marginTop: 8 }}>
          {others.map((o) => <Link key={o.slug} href={`/airlines/${o.slug}`}>{o.name}</Link>)}
          <Link href="/airlines">All airlines</Link>
        </p>
      </section>
      <style>{`@media (max-width: 860px){ .hero { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
