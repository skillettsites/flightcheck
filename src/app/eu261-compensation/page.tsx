import type { Metadata } from "next";
import Link from "next/link";
import JsonLd, { faqSchema } from "@/components/JsonLd";
import CheckForm from "@/components/CheckForm";

export const metadata: Metadata = {
  title: "EU261 compensation: amounts, eligibility and how to claim in 2026",
  description: "Regulation (EC) 261/2004 explained: €250, €400 and €600 by distance, the 3-hour rule, which flights and airlines are covered after Brexit, extraordinary circumstances, time limits by country, and a free check of your flight.",
};

const FAQS = [
  { q: "How much is EU261 compensation?", a: "€250 for flights up to 1,500 km, €400 for flights between 1,500 and 3,500 km and for all intra-EU flights over 1,500 km, €600 for flights over 3,500 km (€300 if the arrival delay was between 3 and 4 hours). Per passenger, fixed by distance, independent of the fare." },
  { q: "Does EU261 still apply to UK passengers after Brexit?", a: "Yes, for flights departing an EU, Norwegian, Icelandic or Swiss airport on any airline, and for flights into the EU on an EU airline. Flights departing the UK are covered by the UK's retained copy, UK261, which pays in sterling. Many UK to EU return journeys are covered by both, one regulation per leg." },
  { q: "What is the EU261 time limit?", a: "The Regulation sets none; national law does. England and Wales 6 years, Ireland 6, France 5, Spain 5, Germany 3, Netherlands 2, Italy 2, Belgium 1. The court that hears the claim decides which applies, usually the departure or arrival state or the airline's seat." },
  { q: "Is a strike an extraordinary circumstance under EU261?", a: "An air traffic control strike or an airport staff strike can be. A strike by the airline's own staff is not (Airhelp v SAS, C-28/20; Krüsemann v TUIfly, C-195/17)." },
  { q: "Can I claim EU261 for a missed connection?", a: "Yes, on a single booking. Delay is measured at the final destination and distance from the first departure airport to the final destination (Folkerts, C-11/11; Wegener, C-537/17), even where the connection was outside the EU." },
];

export default function EU261() {
  return (
    <div className="wrap prose" style={{ paddingTop: 40, paddingBottom: 40, maxWidth: 820 }}>
      <JsonLd data={faqSchema(FAQS)} />
      <p className="eyebrow">Regulation (EC) 261/2004</p>
      <h1 style={{ marginTop: 8 }}>EU261 compensation, explained for 2026</h1>
      <p style={{ fontSize: 18 }}>EU261 is the European regulation that pays fixed cash compensation for long delays, cancellations and denied boarding. Twenty years of court rulings have filled in what the text left out. This is the working version.</p>

      <h2>Amounts (Article 7)</h2>
      <table className="tbl"><thead><tr><th>Distance</th><th>Compensation</th></tr></thead><tbody>
        <tr><td>Up to 1,500 km</td><td className="mono">€250</td></tr>
        <tr><td>1,500 to 3,500 km, and all intra-EU flights over 1,500 km</td><td className="mono">€400</td></tr>
        <tr><td>Over 3,500 km (non intra-EU)</td><td className="mono">€600, or €300 if you arrived 3 to 4 hours late</td></tr>
      </tbody></table>

      <h2>Who is covered (Article 3)</h2>
      <ul>
        <li>Any passenger departing an airport in the EU, Norway, Iceland or Switzerland, on any airline.</li>
        <li>Any passenger arriving at such an airport from a third country on an EU airline (Ryanair, Aer Lingus, KLM, Lufthansa, Vueling, Wizz Air Hungary and so on).</li>
        <li>Since Brexit the UK is a third country for EU261. A flight from London to Paris on British Airways is covered by UK261 (departed the UK) but not by EU261 (BA is not an EU carrier arriving in the EU). The same flight on Air France is covered by both.</li>
      </ul>

      <h2>Delays: the 3-hour rule</h2>
      <p>The Regulation itself promises compensation only for cancellations. In Sturgeon (C-402/07, 2009) and Nelson (C-581/10, 2012) the Court of Justice held that passengers arriving three hours or more late are in the same position and must be compensated the same way. Arrival means the moment a door opens (Germanwings v Henning, C-452/13).</p>

      <h2>Cancellations (Article 5)</h2>
      <p>Compensation is due unless you were informed at least 14 days before departure, or 7 to 13 days before with re-routing departing no more than 2 hours early and arriving under 4 hours late, or under 7 days before with re-routing departing no more than 1 hour early and arriving under 2 hours late. Refund or re-routing (Article 8) and care (Article 9) apply regardless.</p>

      <h2>Extraordinary circumstances (Article 5(3))</h2>
      <p>The airline avoids compensation only by proving the disruption was caused by extraordinary circumstances that could not have been avoided even if all reasonable measures had been taken. Established as not extraordinary: technical faults (Wallentin-Hermann, van der Lans), the airline&apos;s own staff striking (Airhelp v SAS), crew shortages, knock-on delays without reasonable reserve time (Eglītis). Established as potentially extraordinary: severe weather, ATC restrictions or strikes, bird strikes (Pešková), airport closures, security threats, a passenger medical emergency. The airline must also show the event affected your flight; a general statement is not proof, which is why our check shows the Eurocontrol delay record and the airport weather for your day.</p>

      <h2>Time limits</h2>
      <p>Set by national law, not the Regulation. England and Wales 6 years; Ireland 6; France and Spain 5; Germany and Austria 3; Netherlands and Italy 2; Belgium and Poland 1. Claim early while the operational records exist.</p>

      <h2>How to claim</h2>
      <ol>
        <li>Write to the operating airline (not the one that sold the ticket) with flight number, date, booking reference, arrival delay, the article and the amount.</li>
        <li>Give them 28 days, or the period their own procedure states.</li>
        <li>If refused or ignored, use the national enforcement body or ADR scheme of the departure state (for UK departures: CEDR or AviationADR, free), or issue a small claim.</li>
      </ol>

      <div style={{ marginTop: 26 }}>
        <p className="eyebrow" style={{ marginBottom: 10 }}>Check a specific flight</p>
        <CheckForm compact />
      </div>

      <h2>Questions</h2>
      {FAQS.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
      <p className="small muted" style={{ marginTop: 18 }}>See also <Link href="/uk261-compensation">UK261</Link>, the UK version, and the <Link href="/flight-delay-compensation-calculator">compensation calculator</Link>.</p>
    </div>
  );
}
