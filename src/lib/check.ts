import { adbUtc, fetchFlight, fetchTypicalArrivalIata } from "./aerodatabox";
import { resolveDiversion } from "./diversion";
import { airportByIata, airportByIcao, greatCircleKm, type Airport } from "./airports";
import { airlineByCode, parseFlightNumber } from "./airlines";
import { adrFor, AIRLINE_CLAIM_PAGES, type AdrRoute } from "./adr";
import { airportDay, summariseCauses, type AirportDayDelay, type CoveredAirport } from "./eurocontrol";
import { weatherAround, weatherWindow, type WeatherSummary } from "./metar";
import { bandFor, cancellationEligibility, coverage, delayEligibility, limitation, type CompensationBand, type Disruption, type Eligibility, type RegimeCoverage } from "./eu261";
import { countryName, isEuRegime, isUk } from "./regions";

export interface CheckInput {
  flightNumber: string;
  date: string; // YYYY-MM-DD local departure date
  disruption: Disruption;
  departureIata?: string; // disambiguates multi-leg flight numbers
  bookedArrivalIata?: string; // passenger's booked destination when the record diverted
  noticeDays?: number | null; // cancellations only
  reroutedWithinLimits?: boolean | null; // cancellations only
  passengers?: number;
}

export interface Evidence {
  arrivalAirport: { icao: string; covered: CoveredAirport | null; row: AirportDayDelay | null; causes: ReturnType<typeof summariseCauses> } | null;
  departureAirport: { icao: string; covered: CoveredAirport | null; row: AirportDayDelay | null; causes: ReturnType<typeof summariseCauses> } | null;
  weatherDeparture: WeatherSummary | null;
  weatherArrival: WeatherSummary | null;
}

export interface CheckResult {
  input: CheckInput;
  flight: {
    number: string;
    airline: { code: string; name: string; country: string | null; ukOrEuCarrier: boolean | null };
    status: string;
    departure: { airport: Airport | null; icao: string | null; scheduledUtc: string | null; actualUtc: string | null; scheduledLocal: string | null; actualLocal: string | null };
    arrival: { airport: Airport | null; icao: string | null; scheduledUtc: string | null; actualUtc: string | null; scheduledLocal: string | null; actualLocal: string | null; actualBasis: "gate" | "runway" | null };
    diversionAirport: { airport: Airport | null; icao: string | null; iata: string | null } | null;
    distanceKm: number | null;
    arrivalDelayMin: number | null;
    departureDelayMin: number | null;
    cancelled: boolean;
    diverted: boolean;
    finalArrivalUnverified: boolean;
    dataSource: "AeroDataBox";
  };
  regimes: RegimeCoverage[];
  bands: CompensationBand[];
  eligibility: Eligibility;
  defenceRisk: { level: "low" | "medium" | "high" | "unknown"; summary: string };
  evidence: Evidence;
  limitation: { years: number; where: string; deadline: string | null };
  adr: AdrRoute;
  airlineClaimUrl: string | null;
  verdict: "claim" | "borderline" | "no_claim" | "unclear";
  headline: string;
  generatedAt: string;
}

export interface CheckDeps {
  fetchFlight?: typeof fetchFlight;
  fetchTypicalArrivalIata?: typeof fetchTypicalArrivalIata;
  airportDay?: typeof airportDay;
  weatherAround?: typeof weatherAround;
  weatherWindow?: typeof weatherWindow;
}

function minutesBetween(a: Date | null, b: Date | null): number | null {
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / 60000);
}

export async function runCheck(input: CheckInput, deps: CheckDeps = {}): Promise<CheckResult | { error: string; status: number }> {
  const parsed = parseFlightNumber(input.flightNumber);
  if (!parsed) return { error: "That does not look like a flight number. Try the airline code and number, for example BA117 or FR1234.", status: 400 };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return { error: "Date must be YYYY-MM-DD.", status: 400 };

  const fetched = await (deps.fetchFlight ?? fetchFlight)(parsed.full, input.date);
  if ("error" in fetched) return fetched;
  if (!fetched.length) return { error: "No flight found for that number and date.", status: 404 };

  let resolved = resolveDiversion(fetched, { departureIata: input.departureIata, bookedArrivalIata: input.bookedArrivalIata });
  const cancelledEarly = /cancel/i.test(resolved.primary.status);
  if (!resolved.diverted && !input.bookedArrivalIata && !cancelledEarly) {
    const typical = await (deps.fetchTypicalArrivalIata ?? fetchTypicalArrivalIata)(parsed.full, input.date, resolved.originIata);
    if (typical) resolved = resolveDiversion(fetched, { departureIata: input.departureIata, bookedArrivalIata: input.bookedArrivalIata, typicalArrivalIata: typical });
  }
  const f = resolved.primary;

  const depAirport = airportByIata(f.departure.airport?.iata) ?? airportByIcao(f.departure.airport?.icao) ?? null;
  const bookedIata = resolved.bookedIata ?? resolved.operatingIata;
  const arrAirport = airportByIata(bookedIata) ?? airportByIata(resolved.delayLeg.arrival.airport?.iata) ?? airportByIcao(resolved.delayLeg.arrival.airport?.icao) ?? null;
  const diversionAirport = resolved.diverted && resolved.diversionIata
    ? { airport: airportByIata(resolved.diversionIata) ?? null, icao: airportByIata(resolved.diversionIata)?.icao ?? null, iata: resolved.diversionIata }
    : null;
  const depIcao = f.departure.airport?.icao ?? depAirport?.icao ?? null;
  const arrIcao = arrAirport?.icao ?? resolved.delayLeg.arrival.airport?.icao ?? null;
  const depCountry = depAirport?.country ?? f.departure.airport?.countryCode ?? "";
  const arrCountry = arrAirport?.country ?? resolved.delayLeg.arrival.airport?.countryCode ?? "";

  const airlineCode = (f.airline?.iata ?? parsed.airline).toUpperCase();
  const airline = airlineByCode(airlineCode);
  const airlineCountry = airline?.country ?? null;
  const ukOrEuCarrier = airlineCountry ? isUk(airlineCountry) || isEuRegime(airlineCountry) : null;

  const schedDep = adbUtc(f.departure.scheduledTime);
  const depGate = adbUtc(f.departure.revisedTime), depRunway = adbUtc(f.departure.runwayTime);
  const actDep = depGate && depRunway ? (depGate.getTime() >= depRunway.getTime() ? depRunway : depGate) : depGate ?? depRunway;
  const schedArr = resolved.scheduledUtc;
  const actArr = resolved.actualUtc;
  const actualBasis = resolved.actualBasis;

  const cancelled = /cancel/i.test(f.status);
  const diverted = resolved.diverted;
  const arrivalDelayMin = cancelled ? null : resolved.arrivalDelayMin;
  const departureDelayMin = minutesBetween(schedDep, actDep);
  const bookedForDistance = airportByIata(resolved.bookedIata) ?? arrAirport;
  const distanceKm =
    (depAirport && bookedForDistance && resolved.bookedIata && resolved.bookedIata !== resolved.operatingIata
      ? Math.round(greatCircleKm(depAirport, bookedForDistance))
      : f.greatCircleDistance?.km) ?? (depAirport && arrAirport ? Math.round(greatCircleKm(depAirport, arrAirport)) : null);

  const regimes = coverage({ depCountry, arrCountry, carrierCountry: airlineCountry ?? undefined });
  const intraEu = isEuRegime(depCountry) && isEuRegime(arrCountry);
  const bands = distanceKm !== null ? regimes.map((r) => bandFor(r.regime, distanceKm, intraEu)) : [];

  const disruption: Disruption = cancelled ? "cancellation" : input.disruption;
  let eligibility: Eligibility;
  if (regimes.length === 0) {
    eligibility = { status: "not_eligible", reason: `Neither UK261 nor EU261 covers this flight (${countryName(depCountry)} to ${countryName(arrCountry)}${ukOrEuCarrier === false ? ` on a non-UK, non-EU airline` : ""}). Other countries have their own rules; Canada's APPR and the US DOT refund rules may still help.` };
  } else if (disruption === "cancellation") {
    eligibility = cancellationEligibility({ noticeDays: input.noticeDays ?? null, rerouteOfferedWithinLimits: input.reroutedWithinLimits ?? null });
  } else if (disruption === "denied_boarding") {
    eligibility = { status: "eligible", reason: "Denied boarding against your will (overbooking) carries fixed compensation under Art 4 with no extraordinary-circumstances defence, provided you checked in on time and were not denied for a reason such as documents or safety." };
  } else if (resolved.finalArrivalUnverified) {
    eligibility = { status: "unclear", reason: resolved.note };
  } else {
    eligibility = delayEligibility(arrivalDelayMin);
  }

  // Evidence layer: the airport-attributed delay record and airport weather for the day.
  const day = input.date;
  const airportDayFn = deps.airportDay ?? airportDay;
  const weatherAroundFn = deps.weatherAround ?? weatherAround;
  const weatherWindowFn = deps.weatherWindow ?? weatherWindow;
  const evidenceIcaos = [...new Set([arrIcao, diversionAirport?.icao, depIcao].filter((x): x is string => !!x))];
  const evidenceRows = await Promise.all(evidenceIcaos.map((icao) => airportDayFn(icao, icao === depIcao ? day : (schedArr ? schedArr.toISOString().slice(0, 10) : day))));
  const byIcao = new Map(evidenceIcaos.map((icao, i) => [icao, evidenceRows[i]]));
  const arrEvidence = arrIcao ? byIcao.get(arrIcao) ?? null : null;
  const depEvidence = depIcao ? byIcao.get(depIcao) ?? null : null;
  const wxDep = depIcao && schedDep ? await weatherAroundFn(depIcao, schedDep) : null;
  const arrRef = schedArr ?? actArr ?? adbUtc(f.arrival.revisedTime) ?? adbUtc(f.arrival.scheduledTime);
  const wxStation = resolved.finalArrivalUnverified ? (diversionAirport?.icao ?? arrIcao) : arrIcao;
  const wxArr = wxStation && arrRef && wxStation !== depIcao
    ? await weatherWindowFn(wxStation, new Date(arrRef.getTime() - 4 * 3600_000), new Date(Math.max(arrRef.getTime(), (actArr ?? arrRef).getTime()) + 3600_000))
    : null;
  const evidence: Evidence = {
    arrivalAirport: arrIcao && arrEvidence ? { icao: arrIcao, covered: arrEvidence.covered, row: arrEvidence.row, causes: summariseCauses(arrEvidence.row) } : null,
    departureAirport: depIcao && depEvidence ? { icao: depIcao, covered: depEvidence.covered, row: depEvidence.row, causes: summariseCauses(depEvidence.row) } : null,
    weatherDeparture: wxDep,
    weatherArrival: wxArr,
  };

  const defenceRisk = assessDefenceRisk(evidence, disruption);
  const lim = limitation(depCountry, arrCountry);
  const deadline = (() => {
    const d = new Date(input.date + "T00:00:00Z");
    if (isNaN(d.getTime())) return null;
    d.setUTCFullYear(d.getUTCFullYear() + lim.years);
    return d.toISOString().slice(0, 10);
  })();

  const { verdict, headline } = decide(eligibility, defenceRisk, bands);

  return {
    input,
    flight: {
      number: f.number.replace(/\s+/g, ""),
      airline: { code: airlineCode, name: f.airline?.name ?? airline?.name ?? airlineCode, country: airlineCountry, ukOrEuCarrier },
      status: f.status,
      departure: { airport: depAirport, icao: depIcao, scheduledUtc: schedDep?.toISOString() ?? null, actualUtc: actDep?.toISOString() ?? null, scheduledLocal: f.departure.scheduledTime?.local ?? null, actualLocal: f.departure.revisedTime?.local ?? f.departure.runwayTime?.local ?? null },
      arrival: { airport: arrAirport, icao: arrIcao, scheduledUtc: schedArr?.toISOString() ?? null, actualUtc: actArr?.toISOString() ?? null, scheduledLocal: resolved.scheduledLocal, actualLocal: resolved.actualLocal, actualBasis },
      diversionAirport,
      distanceKm: distanceKm !== null ? Math.round(distanceKm) : null,
      arrivalDelayMin,
      departureDelayMin,
      cancelled,
      diverted,
      finalArrivalUnverified: resolved.finalArrivalUnverified,
      dataSource: "AeroDataBox",
    },
    regimes,
    bands,
    eligibility,
    defenceRisk,
    evidence,
    limitation: { ...lim, deadline },
    adr: adrFor(airlineCode),
    airlineClaimUrl: AIRLINE_CLAIM_PAGES[airlineCode] ?? null,
    verdict,
    headline,
    generatedAt: new Date().toISOString(),
  };
}

export function decide(eligibility: Eligibility, defenceRisk: CheckResult["defenceRisk"], bands: CompensationBand[]): { verdict: CheckResult["verdict"]; headline: string } {
  let verdict: CheckResult["verdict"];
  if (eligibility.status === "eligible") verdict = defenceRisk.level === "high" ? "borderline" : "claim";
  else if (eligibility.status === "not_eligible") verdict = "no_claim";
  else verdict = "unclear";
  const primaryBand = bands[0];
  const money = primaryBand ? `${primaryBand.currency === "GBP" ? "£" : "€"}${primaryBand.amount}` : "";
  const headline =
    verdict === "claim" ? `You have a claim worth ${money} per passenger.` :
    verdict === "borderline" ? `You may have a claim worth ${money} per passenger, but expect the airline to argue extraordinary circumstances.` :
    verdict === "no_claim" ? `This flight does not qualify for compensation.` :
    `We need one more detail to give you a verdict.`;
  return { verdict, headline };
}

/**
 * Re-evaluate a stored check with the one fact the flight record cannot hold: how much notice a
 * cancellation came with (and whether a re-route was offered), or that the passenger was bumped
 * from a flight that ran. No flight, Eurocontrol or METAR fetches; the evidence is reused as is.
 */
export function refineCheck(prev: CheckResult, patch: { noticeDays?: number | null; reroutedWithinLimits?: boolean | null; deniedBoarding?: boolean; bookedArrivalIata?: string }): CheckResult {
  const input: CheckInput = {
    ...prev.input,
    disruption: patch.deniedBoarding ? "denied_boarding" : prev.flight.cancelled ? "cancellation" : prev.input.disruption,
    noticeDays: patch.noticeDays !== undefined ? patch.noticeDays : prev.input.noticeDays,
    reroutedWithinLimits: patch.reroutedWithinLimits !== undefined ? patch.reroutedWithinLimits : prev.input.reroutedWithinLimits,
    bookedArrivalIata: patch.bookedArrivalIata ? patch.bookedArrivalIata.trim().toUpperCase() : prev.input.bookedArrivalIata,
  };
  let eligibility: Eligibility;
  if (prev.regimes.length === 0) eligibility = prev.eligibility;
  else if (input.disruption === "denied_boarding") eligibility = { status: "eligible", reason: "Denied boarding against your will (overbooking) carries fixed compensation under Art 4 with no extraordinary-circumstances defence, provided you checked in on time and were not denied for a reason such as documents or safety." };
  else if (input.disruption === "cancellation") eligibility = cancellationEligibility({ noticeDays: input.noticeDays ?? null, rerouteOfferedWithinLimits: input.reroutedWithinLimits ?? null });
  else if (prev.flight.finalArrivalUnverified && !patch.deniedBoarding) eligibility = { status: "unclear", reason: prev.eligibility.reason };
  else eligibility = delayEligibility(prev.flight.arrivalDelayMin);
  const defenceRisk = assessDefenceRisk(prev.evidence, input.disruption);
  const { verdict, headline } = decide(eligibility, defenceRisk, prev.bands);
  return { ...prev, input, eligibility, defenceRisk, verdict, headline, generatedAt: new Date().toISOString() };
}

export function assessDefenceRisk(e: Evidence, disruption: Disruption): CheckResult["defenceRisk"] {
  if (disruption === "denied_boarding") return { level: "low", summary: "Overbooking has no extraordinary-circumstances defence." };
  const signals: string[] = [];
  let score = 0;
  for (const side of [e.arrivalAirport, e.departureAirport]) {
    if (!side?.row) continue;
    const top = side.causes[0];
    if (!top) continue;
    const big = side.row.delay_min >= 300 || (side.row.delayed_15 ?? 0) >= 10;
    if (top.extraordinary === "likely" && big) { score += 2; signals.push(`${side.icao}: ${side.row.delay_min} min of air-traffic delay that day, mostly ${top.label.toLowerCase()}`); }
    else if (top.extraordinary === "likely") { score += 1; signals.push(`${side.icao}: some ${top.label.toLowerCase()} delay recorded (${side.row.delay_min} min across the day)`); }
  }
  for (const wx of [e.weatherDeparture, e.weatherArrival]) {
    if (!wx) continue;
    if (wx.severity === "adverse") { score += 2; signals.push(`${wx.station}: adverse weather observed (${wx.phenomena.join(", ") || "low visibility or strong gusts"})`); }
    else if (wx.severity === "marginal") { score += 1; signals.push(`${wx.station}: marginal weather (${wx.phenomena.join(", ") || "reduced visibility or gusts"})`); }
  }
  const covered = e.arrivalAirport?.covered || e.departureAirport?.covered;
  const hasWx = e.weatherDeparture?.observations || e.weatherArrival?.observations;
  if (!covered && !hasWx) return { level: "unknown", summary: "No airport delay or weather record was available for this route, so we cannot gauge the airline's likely defence." };
  if (score >= 3) return { level: "high", summary: `The public record gives the airline something to point at: ${signals.join("; ")}. That does not end the claim (the airline must prove the disruption was unavoidable and specific to your flight), but expect pushback.` };
  if (score >= 1) return { level: "medium", summary: `There is a partial defence on the record: ${signals.join("; ")}. Airlines often over-claim these; the letter asks them to evidence the link to your flight.` };
  return { level: "low", summary: "Nothing on the public record that day supports an extraordinary-circumstances defence: no significant air-traffic delay attributed to either airport and no adverse weather observed. Technical faults, crew shortages and knock-on delays are not extraordinary." };
}
