// AeroDataBox via RapidAPI. Basic plan: 400 units/month, flight status = 2 units, data within ±365 days.
// Attribution is required on the Basic plan; the results page credits AeroDataBox.

export interface AdbTime { utc: string; local: string }
export interface AdbLeg {
  airport: { iata?: string; icao?: string; name?: string; countryCode?: string; timeZone?: string };
  scheduledTime?: AdbTime;
  revisedTime?: AdbTime; // actual (or latest estimate) gate time
  runwayTime?: AdbTime;  // actual takeoff / touchdown
  predictedTime?: AdbTime;
  terminal?: string;
  gate?: string;
  quality?: string[];
}
export interface AdbFlight {
  number: string;
  status: string; // Unknown, Expected, EnRoute, CheckIn, Boarding, GateClosed, Departed, Delayed, Approaching, Arrived, Canceled, Diverted, CanceledUncertain
  callSign?: string;
  codeshareStatus?: string;
  isCargo?: boolean;
  lastUpdatedUtc?: string;
  departure: AdbLeg;
  arrival: AdbLeg;
  greatCircleDistance?: { km: number; mile: number };
  airline?: { name: string; iata?: string; icao?: string };
  aircraft?: { model?: string; reg?: string };
}

export async function fetchFlight(flightNumber: string, dateLocal: string): Promise<AdbFlight[] | { error: string; status: number }> {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) return { error: "RAPIDAPI_KEY not configured", status: 500 };
  const url = `https://aerodatabox.p.rapidapi.com/flights/number/${encodeURIComponent(flightNumber)}/${dateLocal}?withAircraftImage=false&withLocation=false`;
  const res = await fetch(url, {
    headers: { "x-rapidapi-key": key, "x-rapidapi-host": "aerodatabox.p.rapidapi.com" },
    // never cache a paid lookup at the CDN layer; we persist what we need ourselves
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  if (res.status === 204 || res.status === 404) return { error: "No flight found for that number and date.", status: 404 };
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { error: `Flight data service returned ${res.status}${body ? `: ${body.slice(0, 200)}` : ""}`, status: res.status };
  }
  const data = (await res.json()) as AdbFlight[];
  return Array.isArray(data) ? data : [data];
}

/** Parse "2026-09-15 14:47Z" into a Date. */
export function adbUtc(t?: AdbTime): Date | null {
  if (!t?.utc) return null;
  const s = t.utc.replace(" ", "T").replace(/Z$/, ":00Z");
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
