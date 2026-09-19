import { sbSelect } from "./supabase";

// Eurocontrol Performance Review Unit: airport arrival ATFM delay per day, split by IATA delay cause code.
// Source: https://ansperformance.eu/data/ (Airport_Arrival_ATFM_Delay.xlsx), ingested into fcc_apt_delay_daily.
// A missing row means no ATFM arrival delay was attributed to that airport that day.

export const CAUSE_LABELS: Record<string, string> = {
  W: "Weather", D: "De-icing", I: "Industrial action (ATC)", N: "Industrial action (non-ATC)", S: "ATC staffing",
  C: "ATC capacity", T: "ATC equipment", G: "Aerodrome capacity", A: "Accident or incident", P: "Special event",
  M: "Airspace management", R: "ATC routeing", E: "Equipment (non-ATC)", V: "Environmental issues", O: "Other", NA: "Not specified",
};

// Whether an airline is likely to plead "extraordinary circumstances" on the back of this cause.
// Weather, ATC strikes and ATC restrictions are the classic examples (recital 14, Art 5(3)).
export const CAUSE_EXTRAORDINARY: Record<string, "likely" | "possible" | "unlikely"> = {
  W: "likely", D: "likely", I: "likely", N: "possible", S: "likely", C: "likely", T: "likely", R: "likely", M: "likely",
  G: "possible", A: "possible", P: "possible", E: "possible", V: "possible", O: "unlikely", NA: "unlikely",
};

export interface AirportDayDelay {
  icao: string;
  day: string;
  arrivals: number | null;
  delay_min: number;
  delayed_flights: number | null;
  delayed_15: number | null;
  causes: Record<string, number>;
}

export interface CoveredAirport { icao: string; name: string; state: string; first_day: string; last_day: string }

export async function airportDay(icao: string, day: string): Promise<{ covered: CoveredAirport | null; row: AirportDayDelay | null }> {
  const [cov, rows] = await Promise.all([
    sbSelect<CoveredAirport>("fcc_airports_covered", `icao=eq.${encodeURIComponent(icao)}&limit=1`),
    sbSelect<AirportDayDelay>("fcc_apt_delay_daily", `icao=eq.${encodeURIComponent(icao)}&day=eq.${day}&limit=1`),
  ]);
  return { covered: cov[0] ?? null, row: rows[0] ?? null };
}

export function summariseCauses(row: AirportDayDelay | null): { code: string; label: string; minutes: number; share: number; extraordinary: "likely" | "possible" | "unlikely" }[] {
  if (!row || !row.delay_min) return [];
  return Object.entries(row.causes)
    .map(([code, minutes]) => ({
      code,
      label: CAUSE_LABELS[code] ?? code,
      minutes,
      share: Math.round((minutes / row.delay_min) * 100),
      extraordinary: CAUSE_EXTRAORDINARY[code] ?? "possible",
    }))
    .sort((a, b) => b.minutes - a.minutes);
}
