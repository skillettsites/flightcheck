import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Flight delay compensation rules: UK261 and EU261 explained",
  description: "How much you are owed for a delayed or cancelled flight, which flights are covered, what counts as extraordinary circumstances, and how long you have. Plain English, with the article numbers.",
};

export default function Rights() {
  return (
    <div className="wrap prose" style={{ paddingTop: 40, maxWidth: 780 }}>
      <p className="eyebrow">Your rights</p>
      <h1 className="cond" style={{ fontSize: "clamp(34px,5vw,56px)", marginTop: 8 }}>Flight compensation, without the fog</h1>
      <p style={{ fontSize: 18 }}>Two near-identical regulations do the work: EU Regulation 261/2004 (EU261) and the copy the UK kept after Brexit (UK261). Same rules, different currencies, different courts.</p>

      <h2>How much</h2>
      <table className="tbl">
        <thead><tr><th>Flight distance</th><th>UK261</th><th>EU261</th></tr></thead>
        <tbody>
          <tr><td>Up to 1,500 km (London to Nice, Dublin, Amsterdam)</td><td className="mono">£220</td><td className="mono">€250</td></tr>
          <tr><td>1,500 to 3,500 km (London to Malaga, Athens, Tenerife)</td><td className="mono">£350</td><td className="mono">€400</td></tr>
          <tr><td>Over 3,500 km (London to New York, Dubai, Orlando)</td><td className="mono">£520 (£260 if 3 to 4 hours late)</td><td className="mono">€600 (€300 if 3 to 4 hours late)</td></tr>
        </tbody>
      </table>
      <p>Per passenger, including children with a paid seat, whatever the ticket cost. Article 7. Distance is the great-circle distance between the first departure airport and the final destination (Art 7(4)). Our check uses the flight record&apos;s distance.</p>

      <h2>When: delays</h2>
      <p>Compensation is due when you arrive at your final destination three hours or more after the scheduled time. The Regulation only mentions cancellations, but the European Court read long delays in (Sturgeon v Condor, C-402/07; Nelson v Lufthansa, C-581/10) and UK courts follow that. &ldquo;Arrival&rdquo; means when at least one aircraft door opens (Germanwings v Henning, C-452/13), not touchdown.</p>
      <p>Under three hours: no compensation, but care. After two hours on a short flight (three medium, four long) the airline must provide meals and refreshments, two calls or emails, and a hotel if you are stuck overnight (Art 9). Keep receipts.</p>

      <h2>When: cancellations</h2>
      <p>Compensation is due unless you were told at least 14 days before departure (Art 5(1)(c)(i)), or told 7 to 13 days before and re-routed to depart no more than 2 hours early and arrive under 4 hours late (ii), or told under 7 days before and re-routed to depart no more than 1 hour early and arrive under 2 hours late (iii). Separately, you are always owed the choice of a refund within 7 days or re-routing (Art 8).</p>

      <h2>When: denied boarding</h2>
      <p>If you were bumped against your will because the flight was overbooked and you had checked in on time, the fixed compensation is due immediately (Art 4) and there is no extraordinary-circumstances defence. Volunteers who accepted the airline&apos;s offer have made a different deal.</p>

      <h2>Which flights</h2>
      <ul>
        <li><strong>UK261:</strong> any flight departing a UK airport, on any airline; and any flight arriving at a UK airport on a UK or EU airline.</li>
        <li><strong>EU261:</strong> any flight departing an EU, Norwegian, Icelandic or Swiss airport, on any airline; and any flight arriving in the EU on an EU airline.</li>
        <li>So: Heathrow to New York on Delta is covered (departs UK). New York to Heathrow on Delta is not. New York to Heathrow on British Airways is. Malaga to Manchester on Ryanair is covered by both.</li>
      </ul>

      <h2>Extraordinary circumstances (Art 5(3))</h2>
      <p>The airline escapes compensation only if it proves the disruption was caused by extraordinary circumstances that could not have been avoided even with all reasonable measures. Both halves matter and the burden is the airline&apos;s.</p>
      <ul>
        <li><strong>Usually counts:</strong> severe weather at the airport, air-traffic control restrictions or an ATC strike, airport closure, security alert, bird strike (Pešková v Travel Service, C-315/15), a medical emergency on board.</li>
        <li><strong>Does not count:</strong> technical faults found in routine maintenance (Wallentin-Hermann v Alitalia, C-549/07; Huzar v Jet2.com [2014] EWCA Civ 791), unexpected technical faults generally (van der Lans v KLM, C-257/14), the airline&apos;s own staff striking (Airhelp v SAS, C-28/20; Krüsemann v TUIfly, C-195/17), crew rostering and sickness, a late inbound aircraft on its own.</li>
        <li><strong>Knock-on delays:</strong> an airline can rely on an extraordinary event affecting an earlier flight by the same aircraft (Transportes Aéreos Portugueses v Flightright, C-74/19), but only if it also shows it took all reasonable measures, including reasonable reserve time in the schedule (Eglītis v Air Baltic, C-294/10).</li>
      </ul>
      <p>This is why our check pulls the Eurocontrol airport delay record and the METAR weather for the day. If they show nothing, the airline&apos;s letter saying &ldquo;adverse weather&rdquo; or &ldquo;air traffic control restrictions&rdquo; is a claim, not a fact, and your reply can say so.</p>

      <h2>How long you have</h2>
      <p>England and Wales: six years from the flight (Limitation Act 1980; Dawson v Thomson Airways [2014] EWCA Civ 845). Scotland: five. Northern Ireland: six. Other EU states range from one year (Belgium, Poland) to ten (Sweden). We can verify flights from the last twelve months automatically.</p>

      <h2>If the airline refuses or ignores you</h2>
      <p>Write once, wait 8 weeks or for a final answer, then go to the airline&apos;s approved alternative dispute resolution scheme: CEDR for British Airways, AviationADR for most others. Free to the passenger, decisions bind the airline. Your check names the right one. Airlines outside any scheme can be reported to the CAA, and every claim can be issued in the county court on the small claims track for a modest fee that you recover if you win.</p>

      <div className="honest" style={{ marginTop: 26 }}>
        <p style={{ margin: 0, fontWeight: 600 }}>None of this needs a claims company.</p>
        <p className="small" style={{ margin: "6px 0 0" }}>The CAA says it; the airlines&apos; forms accept direct claims; the ADR schemes are free. Firms charging 35% to 50% of your payout are selling you paperwork and patience. <Link href="/">Run the free check</Link> and decide for yourself whether £4.99 of paperwork is worth it.</p>
      </div>
    </div>
  );
}
