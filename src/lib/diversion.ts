import { adbUtc, type AdbFlight, type AdbLeg } from "./aerodatabox";

export interface DiversionInput {
  departureIata?: string;
  bookedArrivalIata?: string;
  typicalArrivalIata?: string | null;
}

export interface DiversionResolution {
  primary: AdbFlight;
  delayLeg: AdbFlight;
  diverted: boolean;
  bookedIata: string | null;
  operatingIata: string | null;
  originIata: string | null;
  diversionIata: string | null;
  scheduledUtc: Date | null;
  actualUtc: Date | null;
  actualBasis: "gate" | "runway" | null;
  scheduledLocal: string | null;
  actualLocal: string | null;
  arrivalDelayMin: number | null;
  finalArrivalUnverified: boolean;
  note: string;
}

function iataOf(leg?: AdbLeg): string | null {
  const v = leg?.airport?.iata?.trim().toUpperCase();
  return v || null;
}

function paxFlights(flights: AdbFlight[]): AdbFlight[] {
  const pax = flights.filter((f) => !f.isCargo);
  return pax.length ? pax : flights;
}

export function pickPrimary(flights: AdbFlight[], departureIata?: string): AdbFlight {
  const list = paxFlights(flights);
  if (departureIata) {
    const m = list.find((f) => iataOf(f.departure) === departureIata.toUpperCase());
    if (m) return m;
  }
  return list.find((f) => f.codeshareStatus === "IsOperator") ?? list[0];
}

export function actualArrival(leg: AdbLeg): { at: Date | null; basis: "gate" | "runway" | null; local: string | null } {
  const gateArr = adbUtc(leg.revisedTime);
  const runwayArr = adbUtc(leg.runwayTime);
  const gateTrustworthy = gateArr && (!runwayArr || gateArr.getTime() >= runwayArr.getTime());
  const actArr = gateTrustworthy ? gateArr : runwayArr ?? gateArr;
  const basis: "gate" | "runway" | null = actArr ? (gateTrustworthy ? "gate" : "runway") : null;
  const local = (basis === "gate" ? leg.revisedTime?.local : leg.runwayTime?.local) ?? leg.revisedTime?.local ?? null;
  return { at: actArr, basis, local };
}

function minutesBetween(a: Date | null, b: Date | null): number | null {
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / 60000);
}

function sameAirport(a: string | null, b: string | null): boolean {
  return !!a && !!b && a === b;
}

/**
 * Delay is measured when the passenger reaches the booked destination (Case C-826/19),
 * not the diversion airport. Never invents times: if the booked arrival is missing, delay is null.
 */
export function resolveDiversion(flights: AdbFlight[], opts: DiversionInput = {}): DiversionResolution {
  const list = paxFlights(flights);
  const primary = pickPrimary(list, opts.departureIata);
  const originIata = iataOf(primary.departure);
  const operatingIata = iataOf(primary.arrival);
  const statusDiverted = /divert/i.test(primary.status);

  const fromOrigin = list.filter((f) => !originIata || sameAirport(iataOf(f.departure), originIata));
  const destsFromOrigin = [...new Set(fromOrigin.map((f) => iataOf(f.arrival)).filter((x): x is string => !!x))];

  const continuation = operatingIata
    ? list.find((f) => sameAirport(iataOf(f.departure), operatingIata) && iataOf(f.arrival) && !sameAirport(iataOf(f.arrival), operatingIata))
    : undefined;

  const bookedHint = (opts.bookedArrivalIata || opts.typicalArrivalIata || "").trim().toUpperCase() || null;
  let bookedIata: string | null = bookedHint;
  if (!bookedIata && continuation) bookedIata = iataOf(continuation.arrival);
  if (!bookedIata && destsFromOrigin.length > 1 && operatingIata) {
    bookedIata = destsFromOrigin.find((d) => d !== operatingIata) ?? null;
  }
  const divertedHint = statusDiverted || !!continuation || (!!bookedIata && !!operatingIata && bookedIata !== operatingIata);
  // Never treat the diversion airport as the booked destination just because the feed overwrote it.
  if (!bookedIata && !divertedHint) bookedIata = operatingIata;

  const diverted =
    divertedHint ||
    (!!operatingIata && !!bookedIata && operatingIata !== bookedIata);

  const bookedFromOrigin = bookedIata
    ? fromOrigin.find((f) => sameAirport(iataOf(f.arrival), bookedIata))
    : undefined;
  const bookedArrivalRecord = bookedIata
    ? list.find((f) => sameAirport(iataOf(f.arrival), bookedIata) && actualArrival(f.arrival).at)
      ?? bookedFromOrigin
      ?? continuation
    : undefined;

  const delayLeg = diverted ? (bookedArrivalRecord ?? primary) : primary;
  const schedSource = diverted ? (bookedFromOrigin ?? continuation ?? delayLeg) : primary;
  const scheduledUtc = adbUtc(schedSource.arrival.scheduledTime);
  const actual = actualArrival(delayLeg.arrival);
  const emptyActual: { at: Date | null; basis: "gate" | "runway" | null; local: string | null } = { at: null, basis: null, local: null };
  const bookedActual = diverted && bookedIata && sameAirport(iataOf(delayLeg.arrival), bookedIata) ? actual : diverted ? emptyActual : actual;

  const haveBookedActual = !diverted || (!!bookedActual.at && sameAirport(iataOf(delayLeg.arrival), bookedIata));
  const finalArrivalUnverified = diverted && (!bookedIata || !scheduledUtc || !haveBookedActual);
  const arrivalDelayMin = finalArrivalUnverified ? null : minutesBetween(scheduledUtc, diverted ? bookedActual.at : actual.at);
  const displayActual = diverted ? bookedActual : actual;

  let note = "";
  if (finalArrivalUnverified) {
    const via = operatingIata ? ` to ${operatingIata}` : "";
    const booked = bookedIata ? ` booked destination ${bookedIata}` : " the booked destination";
    note = `The flight record shows a diversion${via}. Compensation delay is measured when you reach${booked} (Case C-826/19), and we could not verify that final arrival from the public record. We have not treated the diversion-airport landing as an on-time arrival.`;
  } else if (diverted && arrivalDelayMin !== null) {
    note = `Diverted via ${operatingIata}. Delay is measured at booked destination ${bookedIata}.`;
  }

  return {
    primary,
    delayLeg,
    diverted,
    bookedIata,
    operatingIata,
    originIata,
    diversionIata: diverted ? operatingIata : null,
    scheduledUtc: finalArrivalUnverified && !bookedFromOrigin ? null : scheduledUtc,
    actualUtc: displayActual.at,
    actualBasis: displayActual.basis,
    scheduledLocal: finalArrivalUnverified && !bookedFromOrigin ? null : (schedSource.arrival.scheduledTime?.local ?? null),
    actualLocal: displayActual.local,
    arrivalDelayMin,
    finalArrivalUnverified,
    note,
  };
}
