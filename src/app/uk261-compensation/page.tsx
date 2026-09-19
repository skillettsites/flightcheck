import type { Metadata } from "next";
import Link from "next/link";
import JsonLd, { faqSchema } from "@/components/JsonLd";
import CheckForm from "@/components/CheckForm";

export const metadata: Metadata = {
  title: "UK261 compensation: £220, £350 and £520 explained",
  description: "The UK's retained version of EU261: who is covered after Brexit, the sterling amounts, the 3-hour rule, extraordinary circumstances, the 6-year limit and the free ADR schemes (CEDR and AviationADR). Check your flight free.",
};

const FAQS = [
  { q: "What is UK261?", a: "Regulation (EC) 261/2004 as it was kept in UK law at the end of 2020 and amended by the Air Passenger Rights and Air Travel Organisers' Licensing (Amendment) (EU Exit) Regulations 2019. Same structure and rights as EU261, amounts converted to sterling, enforced by the Civil Aviation Authority and the UK courts." },
  { q: "How much is UK261 compensation?", a: "£220 for flights up to 1,500 km, £350 for 1,500 to 3,500 km, £520 for over 3,500 km (£260 if the long-haul arrival delay was between 3 and 4 hours). Per passenger." },
  { q: "Which flights does UK261 cover?", a: "Any flight departing a UK airport on any airline, and any flight arriving at a UK airport on a UK or EU airline. A Delta flight from New York to Heathrow is not covered; the same flight on BA or Virgin Atlantic is." },
  { q: "How long do I have to claim under UK261?", a: "Six years from the flight in England and Wales (Dawson v Thomson Airways, Court of Appeal 2014), five in Scotland, six in Northern Ireland." },
  { q: "Where do I go if the airline refuses?", a: "The CAA-approved ADR scheme the airline belongs to: CEDR for British Airways, AviationADR for easyJet, Ryanair, Jet2, TUI, Wizz Air, Virgin Atlantic and most others. Free to passengers, binding on the airline. Or the small claims track in the county court." },
];

export default function UK261() {
  return (
    <div className="wrap prose" style={{ paddingTop: 40, paddingBottom: 40, maxWidth: 820 }}>
      <JsonLd data={faqSchema(FAQS)} />
      <p className="eyebrow">UK261</p>
      <h1 style={{ marginTop: 8 }}>UK261 compensation, in sterling and in plain terms</h1>
      <p style={{ fontSize: 18 }}>When the UK left the EU it kept Regulation 261/2004 word for word, converted the money to pounds and handed enforcement to the CAA and the UK courts. If your flight left a UK airport, or landed at one on a UK or EU airline, this is your regulation.</p>

      <h2>Amounts</h2>
      <table className="tbl"><thead><tr><th>Distance</th><th>Per passenger</th></tr></thead><tbody>
        <tr><td>Up to 1,500 km</td><td className="mono">£220</td></tr>
        <tr><td>1,500 to 3,500 km</td><td className="mono">£350</td></tr>
        <tr><td>Over 3,500 km</td><td className="mono">£520, or £260 if you arrived 3 to 4 hours late</td></tr>
      </tbody></table>

      <h2>Differences from EU261 that matter</h2>
      <ul>
        <li><strong>Currency and courts.</strong> Sterling amounts, county court small claims track, CEDR and AviationADR as the free dispute schemes.</li>
        <li><strong>Coverage of inbound flights.</strong> UK261 covers flights into the UK on UK and EU carriers. EU261 covers flights into the EU on EU carriers only, so a UK carrier flying into the EU is covered only by UK261 (because it departed the UK).</li>
        <li><strong>Case law.</strong> UK courts apply the pre-2021 European rulings (Sturgeon, Wallentin-Hermann and the rest) and their own: Huzar v Jet2.com on technical faults, Dawson v Thomson on the 6-year limit, Gahan v Emirates on delays at the final destination after a connection outside the UK.</li>
        <li><strong>Limitation.</strong> 6 years in England and Wales, far longer than most EU states.</li>
      </ul>

      <h2>The claim in practice</h2>
      <ol>
        <li>Write to the operating airline: flight number, date, booking reference, arrival delay, Article 7, amount per passenger, total.</li>
        <li>Expect a reply within 28 days. Airlines most often refuse on &ldquo;extraordinary circumstances&rdquo;; the burden of proof is theirs.</li>
        <li>Refused or ignored for 8 weeks: refer to CEDR or AviationADR. Free to you. Decisions bind the airline.</li>
        <li>Still nothing: small claim online, court fee recoverable if you win.</li>
      </ol>

      <div style={{ marginTop: 26 }}>
        <p className="eyebrow" style={{ marginBottom: 10 }}>Check a specific flight</p>
        <CheckForm compact />
      </div>

      <h2>Questions</h2>
      {FAQS.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
      <p className="small muted" style={{ marginTop: 18 }}>See also <Link href="/eu261-compensation">EU261</Link> and <Link href="/your-rights">your rights in full</Link>.</p>
    </div>
  );
}
