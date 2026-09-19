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

function IconSearch() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16 16.5 20 20.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function IconLetter() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7 9.5h10M7 13h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function IconSend() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 12 20 5l-6.5 15-2.2-6.4L4 12Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

export default async function Home() {
  const since = new Date(Date.now() - 45 * 86_400_000).toISOString().slice(0, 10);
  const tape = await tapeDays(since, 20).catch(() => []);
  const track = tape.length ? [...tape, ...tape] : [];

  return (
    <>
      <JsonLd data={[orgSchema(), websiteSchema(), productSchema(), faqSchema(HOME_FAQS)]} />

      <section className="wrap hero">
        <div>
          <h1>See if you’re owed money for a delayed flight.</h1>
          <p className="muted hero-sub">
            The free check applies UK261 and EU261, and the leading cases, to your flight’s public record: times, Eurocontrol delay causes and METAR weather. You see whether there is a claim, and how the airline is likely to argue.
          </p>
          <p className="small muted" style={{ marginTop: 12, maxWidth: "42ch" }}>
            If there is a claim, a letter is £4.99. You send it yourself.
          </p>
        </div>
        <CheckForm />
      </section>

      <section className="wrap" style={{ paddingTop: 8, paddingBottom: 8 }}>
        <div className="steps">
          <div className="step">
            <span className="step-icon"><IconLetter /></span>
            <div>
              <h3>Rules on your flight</h3>
              <p className="small muted" style={{ margin: 0 }}>UK261, EU261 and the leading cases applied to the route, the airline and the delay. Not a blank form.</p>
            </div>
          </div>
          <div className="step">
            <span className="step-icon"><IconSearch /></span>
            <div>
              <h3>Evidence for the defence</h3>
              <p className="small muted" style={{ margin: 0 }}>Public records that answer “extraordinary circumstances”: Eurocontrol delay causes and METAR weather at both airports.</p>
            </div>
          </div>
          <div className="step">
            <span className="step-icon"><IconSend /></span>
            <div>
              <h3>A letter that uses that</h3>
              <p className="small muted" style={{ margin: 0 }}>Written from those arguments, for £4.99. You send it. You keep 100% of whatever the airline pays.</p>
            </div>
          </div>
        </div>
      </section>

      {track.length > 0 && (
        <div className="tape" aria-label="Recent airport disruption days on record" style={{ marginTop: 40 }}>
          <div className="tape-track">
            {track.map((d, i) => (
              <Link key={`${d.icao}-${d.day}-${i}`} href={`/airport-delays/${d.airport.slug}/${d.day}`} className="tape-item" aria-hidden={i >= tape.length} tabIndex={i >= tape.length ? -1 : undefined}>
                {mediumDate(d.day)} · <b>{shortName(d.airport)}</b> · {d.delay_min.toLocaleString()} min held · <span className="amber">{topCause(d.causes)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <section className="wrap" style={{ paddingTop: 56 }}>
        <p className="eyebrow">Built into every check</p>
        <h2 style={{ marginTop: 8, marginBottom: 22 }}>What you’re actually getting</h2>
        <div className="grid-2">
          <div className="card">
            <p className="eyebrow" style={{ color: "var(--accent)" }}>Rules</p>
            <h3>UK261 and EU261, by route and airline</h3>
            <p className="small muted" style={{ margin: 0 }}>Coverage follows who flew and which way. Distance bands, the three-hour arrival test, and the cancellation notice rules, applied to this flight.</p>
          </div>
          <div className="card">
            <p className="eyebrow" style={{ color: "var(--accent)" }}>Case law</p>
            <h3>The rulings airlines lean on</h3>
            <p className="small muted" style={{ margin: 0 }}>Technical faults are not extraordinary (<Link href="/airlines/jet2">Huzar v Jet2.com</Link>, van der Lans v KLM). A strike by the airline’s own staff is not either (Airhelp v SAS). Those sit in the check, not in a generic template.</p>
          </div>
          <div className="card">
            <p className="eyebrow" style={{ color: "var(--accent)" }}>Airlines</p>
            <h3>The patterns each carrier actually uses</h3>
            <p className="small muted" style={{ margin: 0 }}><Link href="/airlines/british-airways">BA</Link> and technical faults. <Link href="/airlines/ryanair">Ryanair</Link> and ATC. <Link href="/airlines/jet2">Jet2</Link> and Huzar. Each airline page has the routes, the claim form, and the arguments they reach for.</p>
          </div>
          <div className="card">
            <p className="eyebrow" style={{ color: "var(--accent)" }}>Evidence</p>
            <h3>STA, ATA, ATFM and METAR</h3>
            <p className="small muted" style={{ margin: 0 }}>Scheduled and actual times from the flight record, Eurocontrol delay by cause, and weather at both airports. The letter can push back because those facts are on the page.</p>
          </div>
        </div>
      </section>

      <section className="wrap" style={{ paddingTop: 56 }}>
        <p className="eyebrow">How the check works</p>
        <h2 style={{ marginTop: 8, marginBottom: 22 }}>Three public records, read together</h2>
        <div className="strip">
          <div className="card" style={{ boxShadow: "var(--shadow)" }}>
            <p className="eyebrow" style={{ color: "var(--accent)" }}>Flight</p>
            <p className="stat">STA / ATA</p>
            <p className="small muted" style={{ margin: 0 }}>Scheduled and actual gate or touchdown times, cancellation, diversion, and the distance that fixes your band. From AeroDataBox, flights in the last 12 months.</p>
          </div>
          <div className="card" style={{ boxShadow: "var(--shadow)" }}>
            <p className="eyebrow" style={{ color: "var(--accent)" }}>Air traffic</p>
            <p className="stat">ATFM min</p>
            <p className="small muted" style={{ margin: 0 }}>Eurocontrol attributes every minute of arrival holding at every European airport to a cause, daily, since 2019. A blank day leaves the airline’s “extraordinary circumstances” line with nothing under it.</p>
          </div>
          <div className="card" style={{ boxShadow: "var(--shadow)" }}>
            <p className="eyebrow" style={{ color: "var(--accent)" }}>Weather</p>
            <p className="stat">METAR</p>
            <p className="small muted" style={{ margin: 0 }}>Visibility, gusts, thunderstorms or snow at both airports around your flight. Airlines say “weather” a lot. This shows whether there was any.</p>
          </div>
        </div>
      </section>

      <section className="wrap" style={{ paddingTop: 56 }}>
        <div className="sample">
          <div>
            <p className="eyebrow">A real check</p>
            <h2 style={{ marginTop: 8 }}>What comes back from the record</h2>
            <p className="muted" style={{ marginTop: 12, maxWidth: "44ch" }}>
              easyJet 8160, Ljubljana to Gatwick, 27 June 2026. Touchdown six hours and eight minutes after the scheduled arrival. Under 1,500 km, so £220 a seat under UK261 and €250 under EU261.
            </p>
            <p className="muted" style={{ maxWidth: "44ch" }}>
              Eurocontrol logged 5,876 minutes of weather holding at Gatwick that day, so the airline has a defence to try. Gatwick’s own METAR at 12:50Z read CAVOK at 29°C. The letter asks them to prove the link.
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
            <p className="small" style={{ margin: "12px 0 0" }}>EGKK 271250Z 13003KT 060V190 CAVOK 29/16 Q1016 · Eurocontrol EGKK 2026-06-27: W 5,876 min, 97 of 315 arrivals held.</p>
          </div>
        </div>
      </section>

      <section className="wrap" style={{ paddingTop: 56 }}>
        <div className="two-col">
          <div>
            <p className="eyebrow">What it costs</p>
            <h2 style={{ marginTop: 8 }}>The verdict is free. The letter is £4.99.</h2>
            <p className="muted" style={{ marginTop: 12, maxWidth: "42ch" }}>One-off payment. Compensation goes from the airline to you. We never take a share of what you recover.</p>
            <p className="small muted" style={{ maxWidth: "42ch" }}>Card by Stripe. Documents on screen and by email the moment you pay. <Link href="/refunds">Refund policy</Link>.</p>
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
          </div>
        </div>
      </section>

      <section className="wrap" style={{ paddingTop: 56 }}>
        <div className="card watch-board">
          <div>
            <p className="eyebrow" style={{ margin: 0, color: "var(--accent)" }}>Flight Watch · free</p>
            <h2 style={{ margin: "10px 0 10px" }}>Flying soon? We can check the record after you land.</h2>
            <p className="muted" style={{ margin: 0, maxWidth: "50ch" }}>Paste the booking confirmation. The morning after each flight lands we read the record. If it was three hours late or cancelled, the verdict, the amount and the letter offer are in your inbox. Nothing to pay unless there is a claim.</p>
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

      <section className="wrap" style={{ paddingTop: 56 }}>
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

      <section className="wrap" style={{ paddingTop: 56 }}>
        <div className="notice">
          <span className="eyebrow">Note</span>
          <div>
            <p style={{ margin: 0, fontWeight: 600 }}>You can claim for free without us.</p>
            <p className="small muted" style={{ margin: "6px 0 0" }}>Every airline has a claim form and the CAA, Which? and MoneySavingExpert publish free templates. What they cannot do is pull the flight record, the Eurocontrol delay causes and the weather for your flight and put them in the letter. That is the only thing we charge for.</p>
          </div>
        </div>
      </section>

      <section className="wrap" style={{ paddingTop: 56, paddingBottom: 24 }}>
        <div style={{ maxWidth: 860 }}>
          <p className="eyebrow">Questions people ask first</p>
          <h2 style={{ marginTop: 8, marginBottom: 18 }}>Before you check</h2>
          {HOME_FAQS.map((f) => (
            <details key={f.q}><summary>{f.q}</summary><p>{f.q === "How far back can I claim?" ? <>Six years in England and Wales, five in Scotland. We verify flights from the last 12 months automatically; for older flights, <Link href="/contact">send us the details</Link> and we will look it up by hand.</> : f.a}</p></details>
          ))}
        </div>
      </section>

      <style>{`
        .hero { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; padding-top: 48px; padding-bottom: 36px; }
        .hero h1 { max-width: 14ch; }
        .hero-sub { font-size: 18px; max-width: 44ch; margin: 16px 0 0; }
        .sample { display: grid; grid-template-columns: 1fr 1.2fr; gap: 40px; align-items: start; }
        .strip { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .two-col { display: grid; grid-template-columns: 0.9fr 1.4fr; gap: 40px; align-items: start; }
        .watch-board { display: grid; grid-template-columns: 1.3fr 1fr; gap: 32px; align-items: center; }
        @media (max-width: 900px) {
          .hero, .sample, .two-col, .watch-board { grid-template-columns: 1fr; gap: 24px; }
          .hero { padding-top: 28px; }
          .hero h1 { max-width: none; }
          .strip { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
