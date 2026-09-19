import Link from "next/link";
import CheckForm from "@/components/CheckForm";
import { PRODUCTS } from "@/lib/products";
import JsonLd, { faqSchema, orgSchema, productSchema, websiteSchema } from "@/components/JsonLd";
import { AIRLINE_PAGES } from "@/data/airline-pages";
import { tapeDays, shortName, mediumDate } from "@/lib/disruption";
import { CAUSE_LABELS } from "@/lib/eurocontrol";

export const revalidate = 3600;

const HOME_FAQS = [
  { q: "How late does the flight have to be?", a: "Three hours or more at arrival, measured when the doors open at the gate, not when the wheels touch down. Under three hours there is no compensation, though you were owed food and drink after two hours on a short flight." },
  { q: "How much is flight delay compensation?", a: "Fixed by distance: £220 (up to 1,500 km), £350 (1,500 to 3,500 km), £520 (over 3,500 km) under UK261; €250, €400 and €600 under EU261. Per passenger, regardless of the fare paid. Long-haul flights delayed between three and four hours pay half." },
  { q: "Which flights are covered?", a: "Any flight departing the UK or the EU on any airline, plus flights into the UK on a UK or EU airline and flights into the EU on an EU airline. A Ryanair flight from Malaga to Manchester is covered twice over; a Delta flight from New York to Heathrow is not covered at all." },
  { q: "What are extraordinary circumstances?", a: "Events outside the airline's control that could not have been avoided with all reasonable measures: severe weather, air-traffic control restrictions or strikes, security risks, a bird strike. Not extraordinary, whatever the airline says: technical faults, crew shortages, the airline's own staff striking, or a late inbound aircraft. The airline has to prove it, and that is exactly what the public record in your check is for." },
  { q: "How far back can I claim?", a: "Six years in England and Wales, five in Scotland. We verify flights from the last 12 months automatically; for older flights, send us the details and we will look it up by hand." },
  { q: "Do I have to use a claims company?", a: "No. The Civil Aviation Authority says so, and so do we. Claim directly, and if the airline refuses or ignores you for eight weeks, its approved dispute scheme (CEDR or AviationADR) is free to you and binding on the airline. Your check tells you which one." },
];

function topCause(causes: Record<string, number>): string {
  const [code] = Object.entries(causes).sort((a, b) => b[1] - a[1])[0] ?? ["NA"];
  return CAUSE_LABELS[code] ?? "Not specified";
}

export default async function Home() {
  const since = new Date(Date.now() - 45 * 86_400_000).toISOString().slice(0, 10);
  const tape = await tapeDays(since, 20).catch(() => []);
  const track = tape.length ? [...tape, ...tape] : [];

  return (
    <>
      <JsonLd data={[orgSchema(), websiteSchema(), productSchema(), faqSchema(HOME_FAQS)]} />

      {track.length > 0 && (
        <div className="tape" aria-label="Recent airport disruption days on record">
          <div className="tape-track">
            {track.map((d, i) => (
              <Link key={`${d.icao}-${d.day}-${i}`} href={`/airport-delays/${d.airport.slug}/${d.day}`} className="tape-item" aria-hidden={i >= tape.length} tabIndex={i >= tape.length ? -1 : undefined}>
                {mediumDate(d.day)} · <b>{shortName(d.airport)}</b> · {d.delay_min.toLocaleString()} min held · <span className="amber">{topCause(d.causes)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Hero: the question, then the pass */}
      <section className="wrap" style={{ paddingTop: 44 }}>
        <div className="hero-top">
          <div>
            <p className="eyebrow" style={{ marginBottom: 16 }}>Delayed 3 hours or more · cancelled · denied boarding</p>
            <h1 className="cond" style={{ maxWidth: "14ch" }}>Was your flight late enough to be owed £220 to £520?</h1>
          </div>
          <div className="hero-side">
            <p className="muted" style={{ fontSize: 18, maxWidth: "38ch", margin: 0 }}>
              We read the flight&apos;s recorded arrival time, what Eurocontrol logged at both airports that day and the weather at the hour, then tell you whether there is a claim and how the airline will argue. Free.
            </p>
            <dl className="hero-facts">
              <div><dt>Threshold</dt><dd>3h 00m at the gate</dd></div>
              <div><dt>Per passenger</dt><dd>£220 / £350 / £520</dd></div>
              <div><dt>Time limit</dt><dd>6 years (E&amp;W)</dd></div>
              <div><dt>Claims firms keep</dt><dd>35% to 50%</dd></div>
            </dl>
          </div>
        </div>
        <div style={{ marginTop: 30 }}><CheckForm /></div>
      </section>

      {/* One real check, shown as it comes out */}
      <section className="wrap" style={{ paddingTop: 64 }}>
        <div className="sample">
          <div>
            <p className="eyebrow">A real check</p>
            <h2 style={{ marginTop: 8 }}>What comes back, in the airline&apos;s own units</h2>
            <p className="muted" style={{ marginTop: 12, maxWidth: "44ch" }}>
              easyJet 8160, Ljubljana to Gatwick, 27 June 2026. Touchdown six hours and eight minutes after the scheduled arrival. Under 1,500 km, so £220 a seat under UK261 and €250 under EU261.
            </p>
            <p className="muted" style={{ maxWidth: "44ch" }}>
              The board also shows the catch: Eurocontrol logged 5,876 minutes of weather holding at Gatwick that day, so the airline has a defence to try. Gatwick&apos;s own METAR at 12:50Z read CAVOK at 29°C. The letter asks them to prove the link.
            </p>
            <p className="small muted" style={{ marginTop: 14 }}>Verdict and evidence are free. <Link href="/how-it-works">How each line is worked out</Link>.</p>
          </div>
          <div className="board" aria-label="Example verdict for easyJet 8160 on 27 June 2026">
            <div className="board-head">
              <div>
                <p className="eyebrow" style={{ margin: 0 }}>easyJet · 2026-06-27</p>
                <div className="flightno">U28160</div>
              </div>
              <span className="pill go">Claim</span>
            </div>
            <p className="verdict-line">You have a claim worth £220 per passenger.</p>
            <div className="board-row"><span className="board-key">Route</span><span className="board-val dim"><span className="flap-in" style={{ "--i": 0 } as React.CSSProperties}>LJU → LGW</span></span></div>
            <div className="board-row"><span className="board-key">Scheduled arrival</span><span className="board-val dim"><span className="flap-in" style={{ "--i": 1 } as React.CSSProperties}>17:50 · 27 Jun</span></span></div>
            <div className="board-row"><span className="board-key">Actual touchdown</span><span className="board-val"><span className="flap-in" style={{ "--i": 2 } as React.CSSProperties}>23:58 · 27 Jun</span></span></div>
            <div className="board-row"><span className="board-key">Arrival delay</span><span className="board-val"><span className="flap-in" style={{ "--i": 3 } as React.CSSProperties}>6h 08m</span></span></div>
            <div className="board-row"><span className="board-key">Distance · band</span><span className="board-val dim"><span className="flap-in" style={{ "--i": 4 } as React.CSSProperties}>1,207 km · 1,500 km or less</span></span></div>
            <div className="board-row"><span className="board-key">Regulation</span><span className="board-val dim"><span className="flap-in" style={{ "--i": 5 } as React.CSSProperties}>UK261 + EU261</span></span></div>
            <div className="board-row"><span className="board-key">Per passenger</span><span className="board-val"><span className="flap-in" style={{ "--i": 6 } as React.CSSProperties}>£220</span></span></div>
            <div className="board-row"><span className="board-key">Airline defence risk</span><span className="board-val dim"><span className="flap-in" style={{ "--i": 7 } as React.CSSProperties}>MEDIUM</span></span></div>
            <p className="small" style={{ color: "#7f8b98", margin: "12px 0 0" }}>EGKK 271250Z 13003KT 060V190 CAVOK 29/16 Q1016 · Eurocontrol EGKK 2026-06-27: W 5,876 min, 97 of 315 arrivals held.</p>
          </div>
        </div>
      </section>

      {/* The three records, as a strip rather than three cards */}
      <section className="wrap" style={{ paddingTop: 64 }}>
        <p className="eyebrow">How the check works</p>
        <h2 style={{ marginTop: 8, marginBottom: 22 }}>Three public records, read together</h2>
        <div className="strip">
          <div>
            <p className="strip-k">Record 1 · Flight</p>
            <p className="stat">STA / ATA</p>
            <p className="small muted">The flight by number and date: scheduled and actual gate or touchdown times, cancellation, diversion, and the great-circle distance that fixes your band. From AeroDataBox, flights in the last 12 months.</p>
          </div>
          <div>
            <p className="strip-k">Record 2 · Air traffic</p>
            <p className="stat">ATFM min</p>
            <p className="small muted">Eurocontrol attributes every minute of arrival holding at every European airport to a cause, daily, since 2019: weather, ATC strike, ATC staffing, equipment. A blank day leaves the airline&apos;s &ldquo;extraordinary circumstances&rdquo; line with nothing under it.</p>
          </div>
          <div>
            <p className="strip-k">Record 3 · Weather</p>
            <p className="stat">METAR</p>
            <p className="small muted">The observed visibility, gusts, thunderstorms or snow at both airports around your flight, straight from the airport reports. Airlines say &ldquo;weather&rdquo; a lot. This shows whether there was any.</p>
          </div>
        </div>
      </section>

      {/* Fare table */}
      <section className="wrap" style={{ paddingTop: 64 }}>
        <div className="two-col">
          <div>
            <p className="eyebrow">What it costs</p>
            <h2 style={{ marginTop: 8 }}>The verdict is free. The letter is £4.99.</h2>
            <p className="muted" style={{ marginTop: 12, maxWidth: "42ch" }}>On a £350 medium-haul claim, a no-win-no-fee firm keeps £122 to £176. We keep £4.99 whatever you win, and the money goes straight from the airline to you.</p>
            <p className="small muted" style={{ maxWidth: "42ch" }}>One-off payment, card by Stripe, documents on screen and by email the moment you pay. <Link href="/refunds">Refund policy</Link>.</p>
          </div>
          <div className="ledger">
            <div className="ledger-row">
              <span className="ledger-key">Flight check</span>
              <span><strong>Verdict, amount, evidence</strong><br /><span className="small muted">Flight record, Eurocontrol causes, METAR, regulation, ADR scheme, time limit.</span></span>
              <span className="ledger-val">£0.00</span>
            </div>
            {Object.values(PRODUCTS).map((p) => (
              <div className="ledger-row" key={p.id}>
                <span className="ledger-key">{p.name}</span>
                <span><strong>{p.description}</strong><br /><span className="small muted">{p.includes.slice(0, 3).join(". ")}.</span></span>
                <span className="ledger-val">{p.priceLabel}</span>
              </div>
            ))}
            <div className="ledger-row">
              <span className="ledger-key">Flight Watch</span>
              <span><strong>Every future flight checked the morning after it lands</strong><br /><span className="small muted">Verdict by email. Pay for a letter only if there is a claim.</span></span>
              <span className="ledger-val">£0.00</span>
            </div>
            <div className="ledger-row" style={{ color: "var(--ink-3)" }}>
              <span className="ledger-key">For comparison</span>
              <span><strong style={{ fontWeight: 600 }}>Typical no-win-no-fee claims firm</strong><br /><span className="small">Plus an admin fee on some, deducted before you see the money.</span></span>
              <span className="ledger-val">35% to 50%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Flight Watch */}
      <section className="wrap" style={{ paddingTop: 64 }}>
        <div className="board watch-board">
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>Flight Watch · free</p>
            <h2 style={{ color: "#fff", margin: "10px 0 10px" }} className="cond">Flying soon? Hand us the flight numbers and forget about it.</h2>
            <p style={{ color: "#c9d1da", margin: 0, maxWidth: "50ch" }}>Paste the booking confirmation. The morning after each flight lands we read the record; if it was three hours late or cancelled, the verdict, the amount and the letter offer are in your inbox. Nothing to pay unless there is a claim.</p>
            <div style={{ marginTop: 18 }}><Link href="/watch" className="btn btn-accent">Watch my flights</Link></div>
          </div>
          <div>
            <div className="board-row"><span className="board-key">Cost</span><span className="board-val">£0</span></div>
            <div className="board-row"><span className="board-key">Checked</span><span className="board-val dim">Morning after landing</span></div>
            <div className="board-row"><span className="board-key">If 3h+ late</span><span className="board-val dim">Verdict + amount emailed</span></div>
            <div className="board-row"><span className="board-key">If on time</span><span className="board-val dim">One line, then silence</span></div>
            <div className="board-row"><span className="board-key">Unsubscribe</span><span className="board-val dim">One click, any email</span></div>
          </div>
        </div>
      </section>

      {/* Airline index */}
      <section className="wrap" style={{ paddingTop: 64 }}>
        <div className="two-col" style={{ alignItems: "start" }}>
          <div>
            <p className="eyebrow">By airline</p>
            <h2 style={{ marginTop: 8 }}>Your airline decides which direction is covered</h2>
            <p className="muted" style={{ marginTop: 12, maxWidth: "40ch" }}>A UK or EU airline is covered flying home to the UK. Emirates, Qatar, Delta or Turkish are covered only on the way out. Each page has the routes, bands, claim form and the free escalation scheme.</p>
            <p className="small" style={{ marginTop: 14 }}><Link href="/flight-delay-compensation-calculator">Compensation calculator</Link> · <Link href="/airport-delays">Airport delay records</Link> · <Link href="/airlines">All airlines</Link></p>
          </div>
          <nav className="index" aria-label="Airline pages">
            {AIRLINE_PAGES.map((a) => (
              <Link key={a.slug} href={`/airlines/${a.slug}`}>
                <strong>{a.name}</strong>
                <span>{a.code} · {a.carrierType === "uk" ? "UK carrier" : a.carrierType === "eu" ? "EU carrier" : "Non-UK/EU"}</span>
              </Link>
            ))}
          </nav>
        </div>
      </section>

      {/* Plain honesty */}
      <section className="wrap" style={{ paddingTop: 64 }}>
        <div className="notice">
          <span className="eyebrow">Note</span>
          <div>
            <p style={{ margin: 0, fontWeight: 600 }}>You can claim for free without us.</p>
            <p className="small muted" style={{ margin: "6px 0 0" }}>Every airline has a claim form and the CAA, Which? and MoneySavingExpert publish free templates. What they cannot do is pull the flight record, the Eurocontrol delay causes and the weather for your flight and put them in the letter. That is the only thing we charge for.</p>
          </div>
        </div>
      </section>

      {/* FAQ as a numbered record */}
      <section className="wrap" style={{ paddingTop: 64 }}>
        <div style={{ maxWidth: 860 }}>
          <p className="eyebrow">Questions people ask first</p>
          <h2 style={{ marginTop: 8, marginBottom: 18 }}>Before you check</h2>
          {HOME_FAQS.map((f) => (
            <details key={f.q}><summary>{f.q}</summary><p>{f.q === "How far back can I claim?" ? <>Six years in England and Wales, five in Scotland. We verify flights from the last 12 months automatically; for older flights, <Link href="/contact">send us the details</Link> and we will look it up by hand.</> : f.a}</p></details>
          ))}
        </div>
      </section>

      <style>{`
        .hero-top { display: grid; grid-template-columns: 1.15fr 1fr; gap: 40px; align-items: end; }
        .hero-side { display: grid; gap: 22px; padding-bottom: 6px; }
        .hero-facts { margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; border-top: 1.5px solid var(--ink); padding-top: 14px; }
        .hero-facts div { display: grid; gap: 2px; }
        .hero-facts dt { font-family: var(--font-mono); font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-3); }
        .hero-facts dd { margin: 0; font-family: var(--font-mono); font-size: 15px; font-variant-numeric: tabular-nums; }
        .sample { display: grid; grid-template-columns: 1fr 1.25fr; gap: 40px; align-items: start; }
        .strip { display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1.5px solid var(--ink); }
        .strip > div { padding: 18px 22px 8px 0; border-right: 1px solid var(--line); }
        .strip > div + div { padding-left: 22px; }
        .strip > div:last-child { border-right: 0; }
        .strip-k { font-family: var(--font-mono); font-size: 11.5px; letter-spacing: .12em; text-transform: uppercase; color: var(--accent-ink); margin: 0 0 10px; }
        .strip .stat { margin: 0 0 12px; }
        .two-col { display: grid; grid-template-columns: 0.9fr 1.4fr; gap: 40px; align-items: start; }
        .watch-board { display: grid; grid-template-columns: 1.3fr 1fr; gap: 32px; align-items: center; }
        @media (max-width: 900px) {
          .hero-top, .sample, .two-col, .watch-board { grid-template-columns: 1fr; gap: 26px; }
          .hero-facts { display: none; }
          .hero-side p { font-size: 16px !important; }
          .strip { grid-template-columns: 1fr; }
          .strip > div { border-right: 0; border-bottom: 1px solid var(--line); padding: 16px 0; }
          .strip > div + div { padding-left: 0; }
          .strip > div:last-child { border-bottom: 0; }
        }
      `}</style>
    </>
  );
}
