import Link from "next/link";
import CheckForm from "@/components/CheckForm";
import { PRODUCTS } from "@/lib/products";
import JsonLd, { faqSchema, orgSchema, productSchema, websiteSchema } from "@/components/JsonLd";
import { AIRLINE_PAGES } from "@/data/airline-pages";

const HOME_FAQS = [
  { q: "How late does the flight have to be?", a: "Three hours or more at arrival, measured when the doors open at the gate. Under three hours there is no compensation, though care (meals, drinks, calls) is owed after two hours on a short flight." },
  { q: "How much is flight delay compensation?", a: "Fixed by distance: £220 (up to 1,500 km), £350 (1,500 to 3,500 km), £520 (over 3,500 km) under UK261; €250, €400 and €600 under EU261. Per passenger, regardless of the fare. Long-haul flights delayed between three and four hours pay half." },
  { q: "Which flights are covered?", a: "Any flight departing the UK or the EU on any airline, plus flights into the UK on a UK or EU airline and flights into the EU on an EU airline." },
  { q: "What are extraordinary circumstances?", a: "Events outside the airline's control that could not have been avoided with all reasonable measures: severe weather, air-traffic control restrictions or strikes, security risks, bird strikes. Technical faults, crew shortages, the airline's own staff striking and late inbound aircraft are not extraordinary. The airline has to prove it." },
  { q: "How far back can I claim?", a: "Six years in England and Wales, five in Scotland. FlightDelayCheck verifies flights from the last 12 months automatically." },
  { q: "Do I have to use a claims company?", a: "No. Claim directly, and if the airline refuses or ignores you for eight weeks, its approved dispute scheme (CEDR or AviationADR) is free to you and binding on the airline." },
];

export default function Home() {
  return (
    <>
      <JsonLd data={[orgSchema(), websiteSchema(), productSchema(), faqSchema(HOME_FAQS)]} />
      <section className="wrap" style={{ paddingTop: 48, paddingBottom: 30 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 40, alignItems: "start" }} className="hero">
          <div>
            <p className="eyebrow" style={{ marginBottom: 14 }}>UK261 · EU261 · delays, cancellations, denied boarding</p>
            <h1>Was your flight late enough to be owed £220 to £520?</h1>
            <p className="muted" style={{ fontSize: 19, marginTop: 16, maxWidth: "36ch" }}>
              We check the flight&apos;s actual arrival time, the air-traffic delay record and the airport weather for that day, then tell you whether you have a claim and how strong it is. Free.
            </p>
            <ul className="small" style={{ listStyle: "none", padding: 0, margin: "18px 0 0", display: "grid", gap: 8, color: "var(--ink-2)" }}>
              <li>✓ Verified against the flight record, not your memory of it</li>
              <li>✓ Shows what the airline could argue before you write</li>
              <li>✓ Claim letter £4.99. Claims firms take 35% to 50% of your payout</li>
            </ul>
          </div>
          <CheckForm />
        </div>
      </section>

      <section className="wrap" style={{ paddingTop: 30 }}>
        <div className="honest measure">
          <p style={{ margin: 0, fontWeight: 600 }}>You can claim for free without us.</p>
          <p className="small" style={{ margin: "6px 0 0" }}>Every airline has a claim form and the CAA, Which? and MoneySavingExpert publish free templates. What they cannot do is pull the flight record, the Eurocontrol delay causes and the weather for your flight and put them in the letter. That is the only thing we charge for.</p>
        </div>
      </section>

      <section className="wrap" style={{ paddingTop: 56 }}>
        <p className="eyebrow">How the check works</p>
        <h2 style={{ marginTop: 8, marginBottom: 22 }}>Three public records, one verdict</h2>
        <div className="grid-3">
          <div className="card">
            <p className="eyebrow" style={{ color: "var(--accent-ink)" }}>01 · Flight record</p>
            <h3>Scheduled versus actual</h3>
            <p className="small muted">We look up the flight by number and date: scheduled and actual gate times, whether it was cancelled or diverted, and the great-circle distance that sets your compensation band.</p>
          </div>
          <div className="card">
            <p className="eyebrow" style={{ color: "var(--accent-ink)" }}>02 · Airport delay causes</p>
            <h3>What Eurocontrol logged that day</h3>
            <p className="small muted">Every European airport&apos;s air-traffic delay is recorded daily by cause: weather, ATC strike, ATC staffing, equipment failure. If there was none, the airline&apos;s &ldquo;extraordinary circumstances&rdquo; line is weak, and your letter says so.</p>
          </div>
          <div className="card">
            <p className="eyebrow" style={{ color: "var(--accent-ink)" }}>03 · Airport weather</p>
            <h3>The METAR at the hour</h3>
            <p className="small muted">The observed visibility, gusts, thunderstorms or snow at both airports around your flight time. Airlines say &ldquo;weather&rdquo; a lot. This shows whether there was any.</p>
          </div>
        </div>
      </section>

      <section className="wrap" style={{ paddingTop: 56 }}>
        <p className="eyebrow">What it costs</p>
        <h2 style={{ marginTop: 8, marginBottom: 6 }}>The verdict is free. The letter is £4.99.</h2>
        <p className="muted measure" style={{ marginBottom: 22 }}>On a £350 medium-haul claim, a no-win-no-fee firm keeps £122 to £176. We keep £4.99 whatever you win, and we never touch the money.</p>
        <div className="grid-2" style={{ maxWidth: 860 }}>
          {Object.values(PRODUCTS).map((p) => (
            <div className="card" key={p.id} style={p.id === "pack" ? { borderColor: "var(--accent)" } : undefined}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <h3>{p.name}</h3>
                <span className="mono" style={{ fontSize: 22, fontWeight: 500 }}>{p.priceLabel}</span>
              </div>
              <p className="small muted">{p.description}</p>
              <ul className="small" style={{ paddingLeft: 18, margin: "8px 0 0", color: "var(--ink-2)", display: "grid", gap: 4 }}>
                {p.includes.map((x) => <li key={x}>{x}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <p className="small muted" style={{ marginTop: 14 }}>One-off payment. Delivered on screen and by email the moment you pay. <Link href="/refunds">Refund policy</Link>.</p>
      </section>

      <section className="wrap" style={{ paddingTop: 56 }}>
        <p className="eyebrow">By airline</p>
        <h2 style={{ marginTop: 8, marginBottom: 6 }}>Your airline decides which flights are covered</h2>
        <p className="muted measure" style={{ marginBottom: 16 }}>A UK or EU airline is covered flying home to the UK. Emirates, Qatar, Delta or Turkish are covered only on the way out. Each airline page has the routes, bands, claim form and free escalation scheme.</p>
        <p style={{ display: "flex", flexWrap: "wrap", gap: "8px 10px" }}>
          {AIRLINE_PAGES.map((a) => <Link key={a.slug} href={`/airlines/${a.slug}`} className="btn btn-ghost" style={{ padding: "8px 14px", fontSize: 14 }}>{a.name}</Link>)}
          <Link href="/flight-delay-compensation-calculator" className="btn btn-ghost" style={{ padding: "8px 14px", fontSize: 14 }}>Compensation calculator</Link>
        </p>
      </section>

      <section className="wrap" style={{ paddingTop: 56, maxWidth: 820 }}>
        <p className="eyebrow">Questions people ask first</p>
        <h2 style={{ marginTop: 8, marginBottom: 12 }}>Before you check</h2>
        <details><summary>How late does the flight have to be?</summary><p>Three hours or more at arrival, measured when the doors open at the gate, not when the wheels touch down. Under three hours there is no compensation, though you were owed food and drink after two hours on a short flight.</p></details>
        <details><summary>How much is it?</summary><p>Fixed by distance: £220 (up to 1,500 km), £350 (1,500 to 3,500 km), £520 (over 3,500 km) under UK law; €250, €400 and €600 under EU law. Per passenger, regardless of the fare paid. Long-haul flights delayed between three and four hours pay half.</p></details>
        <details><summary>Which flights are covered?</summary><p>Any flight departing the UK or the EU on any airline, plus flights into the UK on a UK or EU airline and flights into the EU on an EU airline. A Ryanair flight from Malaga to Manchester is covered twice over; a Delta flight from New York to Heathrow is not covered at all.</p></details>
        <details><summary>What are &ldquo;extraordinary circumstances&rdquo;?</summary><p>Events outside the airline&apos;s control that could not have been avoided with all reasonable measures: severe weather, air-traffic control restrictions or strikes, security risks, a bird strike. Not extraordinary, whatever the airline says: technical faults, crew shortages, the airline&apos;s own staff striking, or a late inbound aircraft. The airline has to prove it, and that is exactly what the public record in your check is for.</p></details>
        <details><summary>How far back can I claim?</summary><p>Six years in England and Wales, five in Scotland. We can verify flights from the last 12 months automatically; for older flights, <Link href="/contact">send us the details</Link> and we will look it up by hand.</p></details>
        <details><summary>Do I have to use a claims company?</summary><p>No. The Civil Aviation Authority says so, and so do we. Claim directly, and if the airline refuses or ignores you for eight weeks, its approved dispute scheme (CEDR or AviationADR) is free to you and binding on the airline. Your check tells you which one.</p></details>
      </section>

      <style>{`@media (max-width: 860px){ .hero { grid-template-columns: 1fr !important; } }`}</style>
    </>
  );
}
