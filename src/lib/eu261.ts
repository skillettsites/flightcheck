import { isEuRegime, isUk } from "./regions";

// UK261 = Regulation (EC) 261/2004 as retained in UK law (the Air Passenger Rights and Air Travel
// Organisers' Licensing (Amendment) (EU Exit) Regulations 2019). EU261 = the EU original.
// Amounts: UK261 Art 7 in sterling, EU261 Art 7 in euro. Distance bands per Art 7(1), measured great-circle (Art 7(4)).

export type Regime = "UK261" | "EU261";
export type Disruption = "delay" | "cancellation" | "denied_boarding";

export interface RegimeCoverage {
  regime: Regime;
  basis: string; // plain-English reason it applies
}

export interface CompensationBand {
  regime: Regime;
  currency: "GBP" | "EUR";
  amount: number;
  reducedAmount?: number; // the 50% figure where Art 7(2) can apply
  bandLabel: string;
}

export function coverage(args: {
  depCountry: string;
  arrCountry: string;
  carrierCountry?: string; // undefined = unknown carrier
}): RegimeCoverage[] {
  const out: RegimeCoverage[] = [];
  const { depCountry, arrCountry, carrierCountry } = args;
  const carrierIsUkOrEu = carrierCountry ? isUk(carrierCountry) || isEuRegime(carrierCountry) : undefined;
  const carrierIsEu = carrierCountry ? isEuRegime(carrierCountry) : undefined;

  if (isUk(depCountry)) {
    out.push({ regime: "UK261", basis: "the flight departed from a UK airport, so UK261 applies whichever airline operated it" });
  } else if (isUk(arrCountry) && carrierIsUkOrEu) {
    out.push({ regime: "UK261", basis: "the flight arrived at a UK airport on a UK or EU airline" });
  }

  if (isEuRegime(depCountry)) {
    out.push({ regime: "EU261", basis: "the flight departed from an EU (or EEA/Swiss) airport, so EU261 applies whichever airline operated it" });
  } else if (isEuRegime(arrCountry) && carrierIsEu) {
    out.push({ regime: "EU261", basis: "the flight arrived at an EU airport on an EU airline" });
  }
  return out;
}

export function bandFor(regime: Regime, distanceKm: number, intraEu: boolean): CompensationBand {
  if (regime === "UK261") {
    if (distanceKm <= 1500) return { regime, currency: "GBP", amount: 220, bandLabel: "1,500 km or less" };
    if (distanceKm <= 3500) return { regime, currency: "GBP", amount: 350, bandLabel: "1,500 to 3,500 km" };
    return { regime, currency: "GBP", amount: 520, reducedAmount: 260, bandLabel: "over 3,500 km" };
  }
  if (distanceKm <= 1500) return { regime, currency: "EUR", amount: 250, bandLabel: "1,500 km or less" };
  if (distanceKm <= 3500 || intraEu) return { regime, currency: "EUR", amount: 400, bandLabel: intraEu && distanceKm > 3500 ? "intra-EU flight over 1,500 km" : "1,500 to 3,500 km" };
  return { regime, currency: "EUR", amount: 600, reducedAmount: 300, bandLabel: "over 3,500 km" };
}

export interface CancellationNotice {
  noticeDays: number | null; // days before departure the passenger was told; null = unknown
  rerouteOfferedWithinLimits: boolean | null; // Art 5(1)(c)(ii)/(iii) windows met
}

export type Eligibility =
  | { status: "eligible"; reason: string }
  | { status: "not_eligible"; reason: string }
  | { status: "unclear"; reason: string };

export function delayEligibility(arrivalDelayMin: number | null): Eligibility {
  if (arrivalDelayMin === null) return { status: "unclear", reason: "We could not establish the arrival delay from the flight record." };
  if (arrivalDelayMin >= 180)
    return { status: "eligible", reason: `The flight arrived ${fmtMin(arrivalDelayMin)} late. Compensation is due for arrival delays of 3 hours or more (Sturgeon v Condor, applied in UK law by Huzar and Dawson), unless the airline proves extraordinary circumstances it could not have avoided.` };
  if (arrivalDelayMin >= 120)
    return { status: "not_eligible", reason: `The flight arrived ${fmtMin(arrivalDelayMin)} late. Compensation needs 3 hours or more at arrival. You were still owed care (food, drink, communications) after 2 hours on a short-haul flight.` };
  return { status: "not_eligible", reason: arrivalDelayMin <= 0 ? "The flight record shows it arrived on time or early." : `The flight arrived ${fmtMin(arrivalDelayMin)} late, under the 3-hour threshold.` };
}

export function cancellationEligibility(n: CancellationNotice): Eligibility {
  if (n.noticeDays === null) return { status: "unclear", reason: "Compensation for a cancellation depends on how much notice you were given. Tell us when the airline informed you." };
  if (n.noticeDays >= 14) return { status: "not_eligible", reason: "You were told 14 or more days before departure. No compensation is due for the cancellation itself (Art 5(1)(c)(i)), though you are owed a refund or re-routing." };
  if (n.noticeDays >= 7) {
    if (n.rerouteOfferedWithinLimits === true) return { status: "not_eligible", reason: "Told 7 to 13 days before and re-routed within 2 hours before / 4 hours after the original times (Art 5(1)(c)(ii)). No compensation." };
    return { status: "eligible", reason: "You were told between 7 and 13 days before departure and were not re-routed within the Art 5(1)(c)(ii) windows, so compensation is due unless the airline proves extraordinary circumstances." };
  }
  if (n.rerouteOfferedWithinLimits === true) return { status: "not_eligible", reason: "Told under 7 days before and re-routed within 1 hour before / 2 hours after the original times (Art 5(1)(c)(iii)). No compensation." };
  return { status: "eligible", reason: "You were told less than 7 days before departure and were not re-routed within the Art 5(1)(c)(iii) windows, so compensation is due unless the airline proves extraordinary circumstances." };
}

export function fmtMin(m: number): string {
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r} minutes`;
  return `${h}h ${String(r).padStart(2, "0")}m`;
}

// Limitation periods for bringing a claim (from the date of the flight).
export function limitation(depCountry: string, arrCountry: string): { years: number; where: string } {
  if (isUk(depCountry) || isUk(arrCountry)) return { years: 6, where: "England and Wales (6 years, Limitation Act 1980). Scotland: 5 years." };
  const map: Record<string, number> = { IE: 6, FR: 5, ES: 5, PT: 3, DE: 3, NL: 2, IT: 2, BE: 1, AT: 3, GR: 5, PL: 1, DK: 3, SE: 10, FI: 3, CZ: 3, HU: 5 };
  const c = map[depCountry] ?? map[arrCountry];
  if (c) return { years: c, where: `courts of ${depCountry} (${c} years); other EU states differ` };
  return { years: 2, where: "varies by country; assume 2 years to be safe" };
}
