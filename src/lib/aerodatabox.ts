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
  const url = `https://aerodatabox.p.rapidapi.com/flights/number/${encodeURIComponent(flightNumber)}/${dateLocal}?dateLocalRole=Both&withAircraftImage=false&withLocation=false`;
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

/**
 * Modal arrival airport for this flight number in the two weeks before `beforeDate`.
 * Used only to spot a same-day airport swap (diversion) when the feed overwrote the booked dest.
 * Does not copy times from other days. Cached 7 days.
 */
export async function fetchTypicalArrivalIata(flightNumber: string, beforeDate: string, depIata?: string | null): Promise<string | null> {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) return null;
  const end = new Date(beforeDate + "T00:00:00Z");
  if (isNaN(end.getTime())) return null;
  const to = new Date(end.getTime() - 86_400_000);
  const from = new Date(end.getTime() - 14 * 86_400_000);
  const fromS = from.toISOString().slice(0, 10);
  const toS = to.toISOString().slice(0, 10);
  const url = `https://aerodatabox.p.rapidapi.com/flights/number/${encodeURIComponent(flightNumber)}/${fromS}/${toS}?dateLocalRole=Departure&withAircraftImage=false&withLocation=false`;
  try {
    const res = await fetch(url, {
      headers: { "x-rapidapi-key": key, "x-rapidapi-host": "aerodatabox.p.rapidapi.com" },
      next: { revalidate: 604800 },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as AdbFlight[];
    const flights = Array.isArray(data) ? data : [data];
    const counts = new Map<string, number>();
    for (const f of flights) {
      if (f.isCargo) continue;
      const dep = f.departure?.airport?.iata?.toUpperCase();
      const arr = f.arrival?.airport?.iata?.toUpperCase();
      if (!arr) continue;
      if (depIata && dep && dep !== depIata.toUpperCase()) continue;
      counts.set(arr, (counts.get(arr) ?? 0) + 1);
    }
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    if (!ranked[0] || ranked[0][1] < 2) return null;
    const total = [...counts.values()].reduce((s, n) => s + n, 0);
    if (ranked[0][1] / total < 0.5) return null;
    return ranked[0][0];
  } catch {
    return null;
  }
}

/** Parse "2026-09-15 14:47Z" into a Date. */
export function adbUtc(t?: AdbTime): Date | null {
  if (!t?.utc) return null;
  const s = t.utc.replace(" ", "T").replace(/Z$/, ":00Z");
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
