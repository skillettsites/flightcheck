import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { airportBySlug, airportByIcaoRow, dayAcrossAirports, dayRow, displayName, isSignificant, longDate, mediumDate, shortName, worstDays, worstDaysSince } from "@/lib/disruption";
import { CAUSE_EXTRAORDINARY, CAUSE_LABELS, summariseCauses } from "@/lib/eurocontrol";
import { weatherWindow } from "@/lib/metar";
import CheckForm from "@/components/CheckForm";
import JsonLd, { breadcrumbSchema, faqSchema } from "@/components/JsonLd";

export const revalidate = 2592000; // 30 days: the record for a past day does not change
export const dynamicParams = true;
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://flightdelaycheck.co.uk";

export async function generateStaticParams() {
  // Warm the worst 150 days network-wide; everything else renders on first request and is cached.
  const since = "2019-01-01";
  const rows = await worstDaysSince(since, 2500, 150);
  const out: { airport: string; day: string }[] = [];
  for (const r of rows) {
    const a = await airportByIcaoRow(r.icao);
    if (a?.slug) out.push({ airport: a.slug, day: r.day });
  }
  return out;
}

export async function generateMetadata({ params }: { params: Promise<{ airport: string; day: string }> }): Promise<Metadata> {
  const { airport, day } = await params;
  const a = await airportBySlug(airport);
  if (!a || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return {};
  const row = await dayRow(a.icao, day);
  if (!row) return {};
  const causes = summariseCauses(row);
  const top = causes[0];
  const short = shortName(a);
  return {
    title: `${short} delays on ${mediumDate(day)}: ${row.delayed_15 ?? row.delayed_flights ?? "many"} flights held, ${row.delay_min.toLocaleString()} minutes${top ? ` (${top.label.toLowerCase()})` : ""}`,
    description: `On ${longDate(day)} Eurocontrol logged ${row.delay_min.toLocaleString()} minutes of air-traffic arrival delay at ${displayName(a)}${top ? `, ${top.share}% attributed to ${top.label.toLowerCase()}` : ""}. If your flight arrived 3 hours late that day you may be owed £220 to £520. Check it free.`,
    alternates: { canonical: `${SITE}/airport-delays/${a.slug}/${day}` },
  };
}

export default async function DayPage({ params }: { params: Promise<{ airport: string; day: string }> }) {
  const { airport, day } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) notFound();
  const a = await airportBySlug(airport);
  if (!a || !a.slug) notFound();
  const row = await dayRow(a.icao, day);
  if (!row || !isSignificant(row)) notFound();

  const [worst, sameDay] = await Promise.all([worstDays(a.icao, 200), dayAcrossAirports(day, 10)]);
  const rank = worst.findIndex((r) => r.day === day) + 1;
  const causes = summariseCauses(row);
  const top = causes[0];
  const short = shortName(a);
  const name = displayName(a);
  const share = row.arrivals && row.delayed_15 ? Math.round((row.delayed_15 / row.arrivals) * 100) : null;
  const extraordinaryShare = causes.filter((c) => c.extraordinary === "likely").reduce((s, c) => s + c.share, 0);

  // Whole-day METAR summary, cached with the page. Fails soft.
  const wx = await weatherWindow(a.icao, new Date(day + "T00:00:00Z"), new Date(day + "T23:59:00Z")).catch(() => null);

  const otherAirports = (await Promise.all(sameDay.filter((r) => r.icao !== a.icao).map(async (r) => ({ r, a: await airportByIcaoRow(r.icao) })))).filter((x) => x.a?.slug);
  const otherDays = worst.filter((r) => r.day !== day && isSignificant(r)).slice(0, 8);

  const faqs = [
    { q: `My flight from ${short} on ${mediumDate(day)} was delayed. Can I claim compensation?`, a: `If you arrived at your final destination 3 hours or more late, the starting position is £220 to £520 per passenger depending on distance. The airline can refuse only by proving extraordinary circumstances that affected your specific flight. ${top && top.extraordinary === "likely" ? `On this day Eurocontrol attributed ${extraordinaryShare}% of ${short}'s air-traffic delay to ${causes.filter((c) => c.extraordinary === "likely").map((c) => c.label.toLowerCase()).join(" and ")}, so expect that argument; it still has to be linked to your flight.` : `Eurocontrol's record for this day does not show the kind of cause airlines usually plead, so a refusal on those grounds would be weak.`} Run the free check on your flight number for the verified answer.` },
    { q: `Was the ${short} disruption on ${mediumDate(day)} caused by weather?`, a: row.causes.W ? `Partly or wholly: ${Math.round((row.causes.W / row.delay_min) * 100)}% of the ${row.delay_min.toLocaleString()} logged minutes were coded as weather. ${wx && wx.observations ? `The airport's own weather observations that day show ${wx.phenomena.length ? wx.phenomena.join(", ").toLowerCase() : "no significant phenomena"}, lowest visibility ${wx.minVisibilityM ?? "n/a"} m and strongest gust ${wx.maxGustKt ?? "none reported"} kt.` : ""}` : `No. Eurocontrol logged no weather-coded delay at ${short} on this day${top ? `; the delay was attributed to ${top.label.toLowerCase()}` : ""}.` },
    { q: `Does a bad day at ${short} mean every delayed flight is exempt from compensation?`, a: `No. Air-traffic delay attributed to an airport explains some of the day's lateness, not all of it, and it is the airline that must prove your flight's delay was caused by it and could not have been avoided with reasonable measures such as schedule buffers and spare aircraft. Flights delayed by a technical fault, crew shortage or a late inbound aircraft from an unaffected airport are compensable regardless of what happened at ${short}.` },
  ];

  return (
    <div className="wrap" style={{ paddingTop: 32, paddingBottom: 40 }}>
      <JsonLd data={[faqSchema(faqs), breadcrumbSchema([{ name: "Home", url: SITE }, { name: "Airport delays", url: `${SITE}/airport-delays` }, { name: name, url: `${SITE}/airport-delays/${a.slug}` }, { name: mediumDate(day), url: `${SITE}/airport-delays/${a.slug}/${day}` }])]} />
      <p className="eyebrow"><Link href="/airport-delays" style={{ textDecoration: "none" }}>Airport delays</Link> · <Link href={`/airport-delays/${a.slug}`} style={{ textDecoration: "none" }}>{name}</Link> · {a.iata ?? a.icao}</p>
      <h1 style={{ marginTop: 8 }}>{short} delays on {longDate(day)}</h1>
      <p className="muted" style={{ fontSize: 18, marginTop: 12, maxWidth: "70ch" }}>
        Eurocontrol logged <strong>{row.delay_min.toLocaleString()} minutes</strong> of air-traffic arrival delay at {name} that day across {row.delayed_15 ?? row.delayed_flights ?? "an unrecorded number of"} arrivals held 15 minutes or more{row.arrivals ? ` out of ${row.arrivals}` : ""}{share !== null ? ` (${share}% of the day's arrivals)` : ""}{top ? `, with ${top.share}% of the delay attributed to ${top.label.toLowerCase()}` : ""}.{rank > 0 ? ` That makes it the ${ordinal(rank)} worst day at ${short} since January 2019.` : ""}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 30, alignItems: "start", marginTop: 20 }} className="hero">
        <section className="board" aria-label="Delay record">
          <p className="eyebrow" style={{ margin: 0 }}>Eurocontrol record · {a.icao} · {day}</p>
          <div className="board-row"><span className="board-key">ATFM arrival delay</span><span className="board-val">{row.delay_min.toLocaleString()} min</span></div>
          <div className="board-row"><span className="board-key">Arrivals held 15+ min</span><span className="board-val dim">{row.delayed_15 ?? "n/a"}{row.arrivals ? ` of ${row.arrivals}` : ""}</span></div>
          {causes.map((c) => (
            <div className="board-row" key={c.code}><span className="board-key">{c.label}</span><span className={`board-val ${c.extraordinary === "likely" ? "" : "dim"}`}>{c.minutes.toLocaleString()} min · {c.share}%</span></div>
          ))}
          {wx && wx.observations > 0 && (
            <>
              <div className="board-row"><span className="board-key">Weather observed (METAR)</span><span className="board-val dim">{wx.severity.toUpperCase()}</span></div>
              <div className="board-row"><span className="board-key">Lowest visibility · max gust</span><span className="board-val dim">{wx.minVisibilityM !== null ? `${wx.minVisibilityM.toLocaleString()} m` : "n/a"} · {wx.maxGustKt !== null ? `${wx.maxGustKt} kt` : "none"}</span></div>
              {wx.phenomena.length > 0 && <div className="board-row"><span className="board-key">Phenomena</span><span className="board-val dim">{wx.phenomena.join(", ")}</span></div>}
            </>
          )}
          <p className="small" style={{ color: "#8a96ad", margin: "12px 0 0" }}>Delay codes are Eurocontrol&apos;s IATA-standard causes. {extraordinaryShare > 0 ? `${extraordinaryShare}% of this day's delay sits in categories airlines usually plead as extraordinary circumstances.` : "None of this day's delay sits in the categories airlines usually plead as extraordinary."}</p>
        </section>
        <div>
          <p className="eyebrow" style={{ marginBottom: 8 }}>Were you on a flight that day?</p>
          <CheckForm compact defaultDate={day} />
        </div>
      </div>

      <section style={{ marginTop: 34, maxWidth: 820 }} className="prose">
        <h2>What this means if your flight was late</h2>
        <p>Under UK261 and EU261 you are owed £220, £350 or £520 (or €250, €400, €600) per passenger for arriving three hours or more late, unless the airline proves extraordinary circumstances that could not have been avoided even with all reasonable measures. Airport-wide records like this one are the airline&apos;s favourite evidence, and they cut both ways.</p>
        <ul>
          {top && top.extraordinary === "likely" ? (
            <li><strong>Expect the airline to cite {top.label.toLowerCase()}.</strong> That is a real argument on this day, but it only covers delay actually caused by it. The airline must show the link to your flight and that it had reserve time and spare aircraft in place (Eglītis v Air Baltic). A flight that left late because the inbound aircraft was stuck on a technical fault is compensable whatever the weather did.</li>
          ) : (
            <li><strong>The usual defences have little behind them on this day.</strong> {top ? `The logged cause was ${top.label.toLowerCase()}, which is ${CAUSE_EXTRAORDINARY[top.code] === "unlikely" ? "not an extraordinary circumstance" : "arguable at best"}.` : ""} A refusal citing weather or air traffic control should be answered with this record.</li>
          )}
          <li><strong>Cancelled that day?</strong> Compensation depends on notice: under 14 days and no close re-routing means it is due, subject to the same extraordinary-circumstances test. You are always owed a refund or re-routing and care while you wait.</li>
          <li><strong>Delayed under three hours?</strong> No fixed compensation, but food, drink and communications were owed after two hours on a short flight, and reasonable expenses are recoverable.</li>
        </ul>
        <p>The free check pulls your flight&apos;s own record (actual arrival time against schedule) and pairs it with this day&apos;s data, so the verdict and the letter are specific to your flight, not to the airport.</p>
      </section>

      {(otherAirports.length > 0 || otherDays.length > 0) && (
        <section style={{ marginTop: 30 }} className="grid-2">
          {otherAirports.length > 0 && (
            <div className="card">
              <p className="eyebrow">Other airports the same day</p>
              <table className="tbl" style={{ marginTop: 8 }}><tbody>
                {otherAirports.map(({ r, a: oa }) => <tr key={r.icao}><td>{isSignificant(r) ? <Link href={`/airport-delays/${oa!.slug}/${day}`}>{displayName(oa!)}</Link> : displayName(oa!)}</td><td className="mono">{r.delay_min.toLocaleString()} min</td><td className="small">{summariseCauses(r)[0]?.label ?? ""}</td></tr>)}
              </tbody></table>
            </div>
          )}
          {otherDays.length > 0 && (
            <div className="card">
              <p className="eyebrow">Other bad days at {short}</p>
              <table className="tbl" style={{ marginTop: 8 }}><tbody>
                {otherDays.map((r) => <tr key={r.day}><td><Link href={`/airport-delays/${a.slug}/${r.day}`}>{mediumDate(r.day)}</Link></td><td className="mono">{r.delay_min.toLocaleString()} min</td><td className="small">{summariseCauses(r)[0]?.label ?? ""}</td></tr>)}
              </tbody></table>
            </div>
          )}
        </section>
      )}

      <section style={{ marginTop: 34, maxWidth: 820 }}>
        <p className="eyebrow">Questions</p>
        {faqs.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
      </section>
      <p className="small muted" style={{ marginTop: 26 }}>Sources: Eurocontrol Performance Review Unit, airport arrival ATFM delay by cause (daily); METAR observations via the Iowa Environmental Mesonet archive. This page describes the airport&apos;s day; your flight&apos;s own record decides your claim. <Link href={`/airport-delays/${a.slug}`}>All {short} delay days</Link>.</p>
      <style>{`@media (max-width: 860px){ .hero { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
