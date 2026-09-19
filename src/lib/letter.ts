import Anthropic from "@anthropic-ai/sdk";
import type { CheckResult } from "./check";
import { fmtMin } from "./eu261";
import { CAUSE_LABELS } from "./eurocontrol";

export interface Customer {
  name: string;
  address: string;
  email: string;
  bookingRef?: string;
  passengers: number;
  passengerNames?: string;
}

const MODEL = process.env.LETTER_MODEL || "claude-sonnet-5";

function facts(r: CheckResult, c: Customer): string {
  const band = r.bands[0];
  const dep = r.flight.departure, arr = r.flight.arrival;
  const lines = [
    `Flight: ${r.flight.number} operated by ${r.flight.airline.name} (${r.flight.airline.code})`,
    `Date of travel: ${r.input.date}`,
    `Route: ${dep.airport?.name ?? dep.icao} (${dep.airport?.iata ?? ""}) to ${arr.airport?.name ?? arr.icao} (${arr.airport?.iata ?? ""})`,
    `Great-circle distance: ${r.flight.distanceKm} km (band: ${band?.bandLabel ?? "n/a"})`,
    `Scheduled departure (local): ${dep.scheduledLocal}; actual: ${dep.actualLocal ?? "n/a"}`,
    `Scheduled arrival (local): ${arr.scheduledLocal}; actual ${arr.actualBasis === "runway" ? "touchdown" : "gate arrival"}: ${arr.actualLocal ?? "n/a"}`,
    `Arrival delay: ${r.flight.arrivalDelayMin !== null ? fmtMin(r.flight.arrivalDelayMin) : "n/a"}`,
    `Flight status per record: ${r.flight.status}${r.flight.cancelled ? " (cancelled)" : ""}${r.flight.diverted ? " (diverted)" : ""}`,
    `Disruption type claimed: ${r.input.disruption}${r.input.disruption === "cancellation" ? `; notice given: ${r.input.noticeDays ?? "unknown"} days; rerouted within Art 5 windows: ${r.input.reroutedWithinLimits ?? "unknown"}` : ""}`,
    `Applicable regulation(s): ${r.regimes.map((x) => `${x.regime} (${x.basis})`).join("; ") || "none"}`,
    `Compensation per passenger: ${r.bands.map((b) => `${b.currency === "GBP" ? "£" : "€"}${b.amount} under ${b.regime}${b.reducedAmount ? ` (reduces to ${b.currency === "GBP" ? "£" : "€"}${b.reducedAmount} only if re-routed and the Art 7(2) delay limits were met)` : ""}`).join("; ")}`,
    `Passengers on the booking claiming: ${c.passengers}${c.passengerNames ? ` (${c.passengerNames})` : ""}`,
    `Booking reference: ${c.bookingRef || "not provided"}`,
    `Defence risk assessment: ${r.defenceRisk.level}. ${r.defenceRisk.summary}`,
  ];
  const ev = r.evidence;
  for (const [label, side] of [["Arrival airport", ev.arrivalAirport], ["Departure airport", ev.departureAirport]] as const) {
    if (!side) continue;
    if (!side.covered) { lines.push(`${label} ${side.icao}: not in the Eurocontrol airport delay dataset`); continue; }
    if (!side.row) { lines.push(`${label} ${side.icao}: Eurocontrol records NO air-traffic-management arrival delay attributed to this airport on the day`); continue; }
    lines.push(`${label} ${side.icao}: Eurocontrol records ${side.row.delay_min} minutes of ATFM arrival delay across ${side.row.delayed_15 ?? side.row.delayed_flights ?? "?"} delayed arrivals out of ${side.row.arrivals ?? "?"}; causes: ${side.causes.map((x) => `${CAUSE_LABELS[x.code] ?? x.code} ${x.share}%`).join(", ")}`);
  }
  for (const [label, wx] of [["Departure airport weather", ev.weatherDeparture], ["Arrival airport weather", ev.weatherArrival]] as const) {
    if (!wx || !wx.observations) continue;
    lines.push(`${label} (${wx.station}, ${wx.observations} METARs in a 6-hour window): ${wx.severity}; min visibility ${wx.minVisibilityM ?? "n/a"} m; max gust ${wx.maxGustKt ?? "n/a"} kt; phenomena: ${wx.phenomena.join(", ") || "none"}${wx.sampleMetar ? `; sample METAR: ${wx.sampleMetar}` : ""}`);
  }
  return lines.join("\n");
}

const SYSTEM = `You write compensation claim letters for UK and EU air passengers under Regulation (EC) 261/2004 (EU261) and its retained UK version (UK261). You write as the passenger, in the first person, in plain British English, firm and courteous, never threatening. British spelling. No em dashes anywhere; use commas, semicolons or full stops.

Rules:
- Use only the facts supplied. Never invent times, distances, names, reference numbers or law.
- Cite the correct regulation: UK261 for flights covered by UK law (sterling amounts), EU261 for EU law (euro amounts). If both apply, claim under the one whose amount is stated first and mention the other applies too.
- For delays cite Article 7 and the Sturgeon/Nelson line of cases (arrival delay of 3 hours or more equals cancellation for compensation). For cancellations cite Article 5(1)(c) and Article 7. For denied boarding cite Article 4 and Article 7.
- Anticipate the extraordinary-circumstances defence under Article 5(3) in one paragraph: remind the airline the burden of proof is theirs, that technical faults (Wallentin-Hermann, Huzar v Jet2), crew or staffing problems and knock-on delays from earlier rotations are not extraordinary, and that where the public record shows no significant weather or air-traffic restriction that day, say so using the evidence supplied. Where the record does show weather or ATC restrictions, do not deny it; instead require the airline to evidence that it affected this specific flight and that all reasonable measures were taken.
- Ask for payment within 28 days by bank transfer, state the total for all passengers, and say that if the claim is refused or unanswered the passenger will refer it to the airline's approved ADR scheme (name it if supplied) or issue proceedings, with no percentage-fee firm involved.
- Do NOT mention section 75, credit cards, travel insurance, or chargebacks.
- Do NOT include any placeholder brackets. If a booking reference is not provided, omit the line.
- Length: 350 to 550 words. Structure: sender block (name, address, email), date line as "Date: [today's date supplied]", recipient "Customer Relations, [airline]", subject line, body, sign-off with the passenger's name.
- Output the letter only, no commentary.`;

export async function generateLetter(r: CheckResult, c: Customer, todayIso: string): Promise<{ text: string; model: string }> {
  const key = process.env.ANTHROPIC_API_KEY;
  const prompt = `Today's date: ${todayIso}\n\nPassenger:\nName: ${c.name}\nAddress: ${c.address}\nEmail: ${c.email}\n\nVerified facts:\n${facts(r, c)}\n\nADR scheme for this airline: ${r.adr.scheme}\n\nWrite the claim letter.`;
  if (key) {
    try {
      const client = new Anthropic({ apiKey: key });
      const msg = await client.messages.create({ model: MODEL, max_tokens: 1800, system: SYSTEM, messages: [{ role: "user", content: prompt }] });
      const text = msg.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("\n").trim();
      if (text.length > 400) return { text: text.replace(/—/g, ", "), model: MODEL };
    } catch (e) {
      console.error("letter generation failed, using template", e);
    }
  }
  return { text: templateLetter(r, c, todayIso), model: "template" };
}

export function templateLetter(r: CheckResult, c: Customer, todayIso: string): string {
  const band = r.bands[0];
  const cur = band?.currency === "EUR" ? "€" : "£";
  const per = band?.amount ?? 0;
  const total = per * c.passengers;
  const reg = r.regimes[0]?.regime ?? "UK261";
  const dep = r.flight.departure, arr = r.flight.arrival;
  const delay = r.flight.arrivalDelayMin !== null ? fmtMin(r.flight.arrivalDelayMin) : "more than three hours";
  const basis = r.input.disruption === "cancellation" ? "Article 5(1)(c) and Article 7" : r.input.disruption === "denied_boarding" ? "Article 4 and Article 7" : "Article 7, as interpreted in Sturgeon v Condor (C-402/07) and Nelson v Lufthansa (C-581/10)";
  return `${c.name}
${c.address}
${c.email}

Date: ${todayIso}

Customer Relations
${r.flight.airline.name}

Claim for compensation under ${reg}: flight ${r.flight.number} on ${r.input.date}${c.bookingRef ? `, booking reference ${c.bookingRef}` : ""}

Dear Sir or Madam,

I was booked on flight ${r.flight.number} from ${dep.airport?.name ?? dep.icao} to ${arr.airport?.name ?? arr.icao} on ${r.input.date}, scheduled to depart at ${dep.scheduledLocal ?? "the published time"} and arrive at ${arr.scheduledLocal ?? "the published time"}. ${r.input.disruption === "cancellation" ? "The flight was cancelled." : r.input.disruption === "denied_boarding" ? "I was denied boarding against my will despite presenting for check-in on time." : `The flight arrived at ${arr.actualLocal ?? "a later time"}, a delay at arrival of ${delay}.`}

Under ${basis} of ${reg === "UK261" ? "Regulation (EC) 261/2004 as retained in UK law" : "Regulation (EC) 261/2004"}, passengers on a flight of ${r.flight.distanceKm} km (${band?.bandLabel ?? ""}) are entitled to fixed compensation of ${cur}${per} each. ${c.passengers > 1 ? `There were ${c.passengers} passengers on this booking, so the total due is ${cur}${total}.` : `The amount due is ${cur}${total}.`}

I am aware that compensation is not payable where the disruption was caused by extraordinary circumstances which could not have been avoided even if all reasonable measures had been taken (Article 5(3)). The burden of proving that lies with you. Technical problems, crew availability and the knock-on effect of earlier rotations are not extraordinary circumstances (Wallentin-Hermann v Alitalia, C-549/07; Huzar v Jet2.com [2014] EWCA Civ 791). ${r.defenceRisk.level === "low" ? "The public record for that day shows no significant air-traffic restriction attributed to either airport and no adverse weather in the airport observations, so I do not accept that any such circumstances applied." : "If you intend to rely on weather or air-traffic control restrictions, please provide the evidence that they affected this specific flight and the measures you took to avoid the disruption."}

Please pay ${cur}${total} by bank transfer within 28 days of the date of this letter. I will supply account details on request. If the claim is refused or I do not receive a substantive reply, I will refer the matter to ${r.adr.scheme === "unknown" || r.adr.scheme === "CAA PACT" ? "the Civil Aviation Authority" : r.adr.scheme} and, if necessary, issue proceedings in the county court, without the involvement of any claims management firm.

Yours faithfully,

${c.name}`;
}

const ESCALATION_SYSTEM = `You write a short, firm follow-up letter for a UK or EU air passenger whose EU261/UK261 compensation claim has been refused on "extraordinary circumstances" grounds, or ignored. First person, British English, no em dashes, 250 to 400 words, no placeholders. Use only the facts supplied. Structure: sender block, date, recipient, subject "Follow-up: claim for compensation, flight X on date", body, sign-off. Body must: (1) note the refusal or the silence and the date of the original claim ("my letter of [date supplied]"); (2) restate that the burden of proof under Article 5(3) is the airline's and that a generic reference to weather or ATC is not proof: they must show the circumstance affected this flight and that all reasonable measures were taken (Wallentin-Hermann; Huzar v Jet2; Eglitis v Air Baltic on reserve time); (3) if the evidence supplied shows no significant airport delay or adverse weather, say so and cite that it is a matter of public record (Eurocontrol airport delay data and METAR observations); (4) request the operational evidence within 14 days; (5) state that failing that the passenger will refer the complaint to the named ADR scheme, which is free to the passenger and binding on the airline, or issue a county court claim. Output only the letter.`;

export async function generateEscalation(r: CheckResult, c: Customer, todayIso: string, originalLetterDate: string): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  const prompt = `Today's date: ${todayIso}\nOriginal claim letter date: ${originalLetterDate}\nADR scheme: ${r.adr.scheme}\n\nPassenger:\nName: ${c.name}\nAddress: ${c.address}\nEmail: ${c.email}\n\nVerified facts:\n${facts(r, c)}\n\nWrite the follow-up letter.`;
  if (key) {
    try {
      const client = new Anthropic({ apiKey: key });
      const msg = await client.messages.create({ model: MODEL, max_tokens: 1400, system: ESCALATION_SYSTEM, messages: [{ role: "user", content: prompt }] });
      const text = msg.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("\n").trim();
      if (text.length > 300) return text.replace(/—/g, ", ");
    } catch (e) {
      console.error("escalation generation failed", e);
    }
  }
  return `${c.name}\n${c.address}\n${c.email}\n\nDate: ${todayIso}\n\nCustomer Relations\n${r.flight.airline.name}\n\nFollow-up: claim for compensation, flight ${r.flight.number} on ${r.input.date}\n\nDear Sir or Madam,\n\nI wrote to you on ${originalLetterDate} claiming compensation under ${r.regimes[0]?.regime ?? "UK261"} for the disruption to flight ${r.flight.number}. I have either received a refusal relying on extraordinary circumstances or no substantive reply.\n\nThe burden of proving extraordinary circumstances under Article 5(3) rests with you. A general reference to weather or air traffic control is not proof. You must show that the circumstance affected this specific flight and that you took all reasonable measures to avoid the resulting delay (Wallentin-Hermann v Alitalia; Huzar v Jet2.com; Eglitis v Air Baltic). ${r.defenceRisk.level === "low" ? "The public record for the day, including Eurocontrol's airport delay data and the airport weather observations, shows no significant restriction or adverse weather at either airport." : "Please provide the operational evidence on which you rely."}\n\nPlease send that evidence, or payment, within 14 days. If I do not receive either, I will refer this complaint to ${r.adr.scheme === "CAA PACT" || r.adr.scheme === "unknown" ? "the Civil Aviation Authority" : r.adr.scheme}, which is free to me and binding on you, or issue a claim in the county court.\n\nYours faithfully,\n\n${c.name}`;
}
