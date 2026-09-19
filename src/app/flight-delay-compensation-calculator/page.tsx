import type { Metadata } from "next";
import Link from "next/link";
import Calculator from "@/components/Calculator";
import JsonLd, { faqSchema } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Flight delay compensation calculator (UK261 and EU261)",
  description: "Work out exactly what a delayed or cancelled flight is worth per passenger: pick the route and the airline's nationality and the calculator applies the UK261 and EU261 distance bands. Then check the real flight for free.",
};

const FAQS = [
  { q: "How is flight delay compensation calculated?", a: "By great-circle distance between the departure airport and the final destination, not by ticket price or delay length beyond the 3-hour threshold. Up to 1,500 km pays £220 (€250 under EU261); 1,500 to 3,500 km pays £350 (€400); over 3,500 km pays £520 (€600), halved to £260 (€300) if the long-haul arrival delay was between 3 and 4 hours." },
  { q: "Is compensation per person or per booking?", a: "Per passenger, including children who had a paid seat. Infants on a lap without a fare are not usually included." },
  { q: "Does a connection change the distance?", a: "Yes. On a single booking the distance is measured from the first departure airport to the final destination, and the delay is measured at the final destination (Air France v Folkerts, Wegener v Royal Air Maroc)." },
  { q: "Which airlines are covered on the way home?", a: "UK and EU airlines are covered flying into the UK or EU from anywhere. Airlines from other countries are covered only when departing the UK or EU, so an Emirates flight from Dubai to Heathrow is not covered but Heathrow to Dubai is." },
  { q: "What if my flight was under 1,500 km but over 3 hours late?", a: "You are owed £220 (or €250) per passenger, unless the airline proves extraordinary circumstances. The 3-hour threshold is the same for all distances." },
];

export default function CalculatorPage() {
  return (
    <div className="wrap" style={{ paddingTop: 40, paddingBottom: 40 }}>
      <JsonLd data={faqSchema(FAQS)} />
      <p className="eyebrow">Calculator</p>
      <h1 style={{ fontSize: "clamp(30px,4.5vw,44px)", marginTop: 8 }}>Flight delay compensation calculator</h1>
      <p className="muted measure" style={{ fontSize: 18 }}>Pick your route and the airline&apos;s home country. The calculator applies the UK261 and EU261 distance bands and tells you which regulation covers the flight and what the total is for your party.</p>
      <div style={{ marginTop: 22 }}><Calculator /></div>

      <section style={{ marginTop: 40, maxWidth: 820 }} className="prose">
        <h2>The bands</h2>
        <table className="tbl">
          <thead><tr><th>Great-circle distance</th><th>UK261 (GBP)</th><th>EU261 (EUR)</th><th>Examples</th></tr></thead>
          <tbody>
            <tr><td>Up to 1,500 km</td><td className="mono">£220</td><td className="mono">€250</td><td>London to Amsterdam, Paris, Dublin, Geneva, Barcelona; Manchester to Palma</td></tr>
            <tr><td>1,500 to 3,500 km</td><td className="mono">£350</td><td className="mono">€400</td><td>London to Malaga, Faro, Athens, Tenerife, Istanbul; any intra-EU flight over 1,500 km</td></tr>
            <tr><td>Over 3,500 km</td><td className="mono">£520 (£260 if 3 to 4h late)</td><td className="mono">€600 (€300 if 3 to 4h late)</td><td>London to New York, Dubai, Orlando, Cancun, Delhi</td></tr>
          </tbody>
        </table>
        <h2>Then check the real flight</h2>
        <p>The calculator tells you the stake. The <Link href="/">free flight check</Link> tells you whether you actually qualify: it pulls the recorded arrival time, whether the flight was cancelled, and what Eurocontrol and the airport weather logged that day, which is what decides the airline&apos;s &ldquo;extraordinary circumstances&rdquo; defence.</p>
        <h2>Questions</h2>
        {FAQS.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
      </section>
    </div>
  );
}
