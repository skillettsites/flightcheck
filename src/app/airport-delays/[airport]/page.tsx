import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { airportBySlug, displayName, isSignificant, mediumDate, recentDays, shortName, worstDays } from "@/lib/disruption";
import { CAUSE_LABELS } from "@/lib/eurocontrol";
import { AIRLINE_PAGES } from "@/data/airline-pages";
import CheckForm from "@/components/CheckForm";
import JsonLd, { breadcrumbSchema, faqSchema } from "@/components/JsonLd";

export const revalidate = 86400;
export const dynamicParams = true;
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://flightdelaycheck.co.uk";

export async function generateMetadata({ params }: { params: Promise<{ airport: string }> }): Promise<Metadata> {
  const { airport } = await params;
  const a = await airportBySlug(airport);
  if (!a) return {};
  const name = displayName(a);
  return {
    title: `${name} flight delays: worst days on record and compensation`,
    description: `Every day since 2019 that ${name} (${a.iata ?? a.icao}) was hit by weather, air-traffic control, strikes or equipment failures, with the minutes lost and the cause. Was your ${shortName(a)} flight 3 hours late? Check it free and claim £220 to £520.`,
    alternates: { canonical: `${SITE}/airport-delays/${a.slug}` },
  };
}

export default async function AirportPage({ params }: { params: Promise<{ airport: string }> }) {
  const { airport } = await params;
  const a = await airportBySlug(airport);
  if (!a || !a.slug) notFound();
  const [worst, recent] = await Promise.all([worstDays(a.icao, 25), recentDays(a.icao, 45)]);
  const name = displayName(a);
  const short = shortName(a);
  const totalMin = worst.reduce((s, r) => s + r.delay_min, 0);
  const causeTotals: Record<string, number> = {};
  for (const r of [...worst, ...recent]) for (const [c, m] of Object.entries(r.causes)) causeTotals[c] = (causeTotals[c] ?? 0) + m;
  const topCauses = Object.entries(causeTotals).sort((x, y) => y[1] - x[1]).slice(0, 4);
  const airlinesHere = AIRLINE_PAGES.filter((p) => p.hubs.some((h) => name.toLowerCase().includes(h.toLowerCase()) || short.toLowerCase() === h.toLowerCase()));
  const faqs = [
    { q: `Is a delay at ${short} caused by weather always an extraordinary circumstance?`, a: `No. The airline must show that the weather actually affected your flight and that it took all reasonable measures. Eurocontrol logs weather delay at ${short} on specific days; if your day is not one of them, the weather defence has nothing behind it. If it is, the airline still has to connect it to your flight.` },
    { q: `How do I find out if my ${short} flight was delayed 3 hours?`, a: `Enter the flight number and date in the checker above. It pulls the recorded arrival time, works out the delay against the schedule, and shows what Eurocontrol and the airport weather logged for ${short} that day.` },
    { q: `Which airlines' passengers can claim after a ${short} delay?`, a: `Any airline departing ${short} is covered by ${a.country === "GB" ? "UK261" : a.country === "IE" ? "EU261" : "EU261"} regardless of nationality. Arrivals are covered when the airline is a UK or EU carrier${a.country === "GB" ? " (for UK261)" : ""}.` },
  ];

  return (
    <div className="wrap" style={{ paddingTop: 32, paddingBottom: 40 }}>
      <JsonLd data={[faqSchema(faqs), breadcrumbSchema([{ name: "Home", url: SITE }, { name: "Airport delays", url: `${SITE}/airport-delays` }, { name: name, url: `${SITE}/airport-delays/${a.slug}` }])]} />
      <p className="eyebrow"><Link href="/airport-delays" style={{ textDecoration: "none" }}>Airport delays</Link> · {a.iata ?? a.icao} · {a.state}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 36, alignItems: "start", marginTop: 8 }} className="hero">
        <div>
          <h1>{name} flight delays: the record, day by day</h1>
          <p className="muted" style={{ fontSize: 18, marginTop: 14 }}>Eurocontrol attributes air-traffic delay to {short} on the days it happens, with the cause. On its 25 worst days since 2019 the airport lost {totalMin.toLocaleString()} minutes of arrival delay{topCauses.length ? `, mostly to ${topCauses.slice(0, 2).map(([c]) => (CAUSE_LABELS[c] ?? c).toLowerCase()).join(" and ")}` : ""}. Days with nothing logged are a strong point for any passenger whose flight was late for another reason.</p>
        </div>
        <div>
          <p className="eyebrow" style={{ marginBottom: 8 }}>Was your {short} flight 3 hours late?</p>
          <CheckForm compact />
        </div>
      </div>

      <section style={{ marginTop: 36 }} className="grid-2">
        <div className="card">
          <p className="eyebrow">Worst days on record</p>
          <table className="tbl" style={{ marginTop: 8 }}>
            <thead><tr><th>Date</th><th>Delay min</th><th>Late</th><th>Cause</th></tr></thead>
            <tbody>{worst.slice(0, 15).map((r) => {
              const top = Object.entries(r.causes).sort((x, y) => y[1] - x[1])[0];
              return <tr key={r.day}><td className="mono">{isSignificant(r) ? <Link href={`/airport-delays/${a.slug}/${r.day}`}>{mediumDate(r.day)}</Link> : mediumDate(r.day)}</td><td className="mono">{r.delay_min.toLocaleString()}</td><td className="mono">{r.delayed_15 ?? "n/a"}</td><td className="small">{top ? CAUSE_LABELS[top[0]] ?? top[0] : ""}</td></tr>;
            })}</tbody>
          </table>
        </div>
        <div className="card">
          <p className="eyebrow">Most recent days with delay logged</p>
          <table className="tbl" style={{ marginTop: 8 }}>
            <thead><tr><th>Date</th><th>Delay min</th><th>Late</th><th>Cause</th></tr></thead>
            <tbody>{recent.slice(0, 15).map((r) => {
              const top = Object.entries(r.causes).sort((x, y) => y[1] - x[1])[0];
              return <tr key={r.day}><td className="mono">{isSignificant(r) ? <Link href={`/airport-delays/${a.slug}/${r.day}`}>{mediumDate(r.day)}</Link> : mediumDate(r.day)}</td><td className="mono">{r.delay_min.toLocaleString()}</td><td className="mono">{r.delayed_15 ?? "n/a"}</td><td className="small">{top ? CAUSE_LABELS[top[0]] ?? top[0] : ""}</td></tr>;
            })}</tbody>
          </table>
          <p className="small muted" style={{ marginTop: 8 }}>Data to {mediumDate(a.last_day)}. Eurocontrol publishes about a month in arrears.</p>
        </div>
      </section>

      {topCauses.length > 0 && (
        <section style={{ marginTop: 30 }} className="card">
          <p className="eyebrow">What usually goes wrong at {short}</p>
          <div style={{ display: "grid", gap: 8, marginTop: 8, maxWidth: 640 }}>
            {topCauses.map(([c, m]) => { const share = Math.round((m / topCauses.reduce((s, [, v]) => s + v, 0)) * 100); return (
              <div key={c}>
                <div className="small" style={{ display: "flex", justifyContent: "space-between" }}><span>{CAUSE_LABELS[c] ?? c}</span><span className="mono">{share}%</span></div>
                <div className="bar"><span style={{ width: `${share}%` }} /></div>
              </div>
            ); })}
          </div>
          <p className="small muted" style={{ marginTop: 10 }}>Share of logged delay minutes across the worst and most recent days shown above. Weather, ATC staffing, ATC capacity and equipment failures are the causes airlines most often plead as extraordinary; airport capacity and unspecified delay are arguable.</p>
        </section>
      )}

      {airlinesHere.length > 0 && (
        <section style={{ marginTop: 30 }}>
          <p className="eyebrow">Airlines based at {short}</p>
          <p style={{ display: "flex", flexWrap: "wrap", gap: "6px 10px", marginTop: 8 }}>{airlinesHere.map((p) => <Link key={p.slug} href={`/airlines/${p.slug}`} className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 14 }}>{p.name} compensation</Link>)}</p>
        </section>
      )}

      <section style={{ marginTop: 34, maxWidth: 820 }}>
        <p className="eyebrow">Questions</p>
        {faqs.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
      </section>
      <p className="small muted" style={{ marginTop: 26 }}>Source: Eurocontrol Performance Review Unit, airport arrival ATFM delay by cause, daily. See also <Link href="/your-rights">your rights</Link> and the <Link href="/flight-delay-compensation-calculator">compensation calculator</Link>.</p>
      <style>{`@media (max-width: 860px){ .hero { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
