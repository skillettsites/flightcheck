import type { Metadata } from "next";
import Link from "next/link";
import { allCoveredAirports, displayName, mediumDate, worstDaysSince, type CoveredAirportRow } from "@/lib/disruption";
import { CAUSE_LABELS } from "@/lib/eurocontrol";
import JsonLd, { breadcrumbSchema } from "@/components/JsonLd";

export const revalidate = 86400;
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://flightdelaycheck.co.uk";

export const metadata: Metadata = {
  title: "Airport delay records: every bad day at every European airport since 2019",
  description: "Which days Gatwick, Heathrow, Manchester, Dublin and 400 other airports were hit by weather, air-traffic control or strikes, with the minutes lost and the cause. Check whether your delayed flight is owed £220 to £520.",
  alternates: { canonical: `${SITE}/airport-delays` },
};

export default async function AirportDelaysIndex() {
  const since = new Date(Date.now() - 120 * 86400_000).toISOString().slice(0, 10);
  const [airports, recent] = await Promise.all([allCoveredAirports(), worstDaysSince(since, 1500, 30)]);
  const byIcao = new Map(airports.map((a) => [a.icao, a]));
  const groups = new Map<string, CoveredAirportRow[]>();
  for (const a of airports) {
    if (!a.slug) continue;
    const k = a.state;
    groups.set(k, [...(groups.get(k) ?? []), a]);
  }
  const order = ["United Kingdom", "Ireland", ...[...groups.keys()].filter((k) => k !== "United Kingdom" && k !== "Ireland").sort()];

  return (
    <div className="wrap" style={{ paddingTop: 40, paddingBottom: 40 }}>
      <JsonLd data={breadcrumbSchema([{ name: "Home", url: SITE }, { name: "Airport delays", url: `${SITE}/airport-delays` }])} />
      <p className="eyebrow">Airport delay records</p>
      <h1 style={{ fontSize: "clamp(30px,4.5vw,44px)", marginTop: 8 }}>The days the airports broke, airport by airport</h1>
      <p className="muted measure" style={{ fontSize: 18 }}>Eurocontrol logs every minute of air-traffic delay attributed to each European airport, every day, by cause. When an airline says &ldquo;weather&rdquo; or &ldquo;air traffic control&rdquo;, this is the record that says whether it happened. Find your airport and your day, then check your flight.</p>

      <section style={{ marginTop: 30 }}>
        <p className="eyebrow">Worst days in the last four months</p>
        <div style={{ overflowX: "auto", marginTop: 8 }}>
          <table className="tbl">
            <thead><tr><th>Date</th><th>Airport</th><th>Delay minutes</th><th>Flights 15+ min late</th><th>Main cause</th></tr></thead>
            <tbody>
              {recent.map((r) => {
                const a = byIcao.get(r.icao);
                const top = Object.entries(r.causes).sort((x, y) => y[1] - x[1])[0];
                return (
                  <tr key={r.icao + r.day}>
                    <td className="mono">{a?.slug ? <Link href={`/airport-delays/${a.slug}/${r.day}`}>{mediumDate(r.day)}</Link> : mediumDate(r.day)}</td>
                    <td>{a ? <Link href={`/airport-delays/${a.slug}`}>{displayName(a)}</Link> : r.icao}</td>
                    <td className="mono">{r.delay_min.toLocaleString()}</td>
                    <td className="mono">{r.delayed_15 ?? "n/a"}</td>
                    <td>{top ? CAUSE_LABELS[top[0]] ?? top[0] : "n/a"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="small muted" style={{ marginTop: 8 }}>Eurocontrol publishes monthly, so the most recent few weeks appear as they are released. Flights themselves can be checked from the day after they land.</p>
      </section>

      {order.map((state) => {
        const list = groups.get(state);
        if (!list) return null;
        return (
          <section key={state} style={{ marginTop: 34 }}>
            <h2 style={{ fontSize: 22 }}>{state}</h2>
            <p style={{ display: "flex", flexWrap: "wrap", gap: "6px 10px", marginTop: 8 }}>
              {list.map((a) => <Link key={a.icao} href={`/airport-delays/${a.slug}`} className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 14 }}>{displayName(a)}</Link>)}
            </p>
          </section>
        );
      })}
      <p className="small muted" style={{ marginTop: 30 }}>Source: Eurocontrol Performance Review Unit, airport arrival ATFM delay by cause, daily from 1 January 2019. Day pages exist where the delay was significant: 300 minutes or more at UK and Irish airports, 1,000 or more elsewhere.</p>
    </div>
  );
}
