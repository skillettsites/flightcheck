import airportsJson from "@/data/airports.min.json";

// Compact OurAirports extract (public domain): scheduled-service airports with an IATA code.
// i = IATA, c = ICAO, n = name, m = municipality, k = ISO country, la/lo = coordinates.
type Raw = { i: string; c: string; n: string; m: string; k: string; la: number; lo: number };

export interface Airport {
  iata: string;
  icao: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
}

const RAW = airportsJson as Raw[];
const byIata = new Map<string, Airport>();
const byIcao = new Map<string, Airport>();
for (const r of RAW) {
  const a: Airport = { iata: r.i, icao: r.c, name: r.n, city: r.m, country: r.k, lat: r.la, lon: r.lo };
  if (!byIata.has(a.iata)) byIata.set(a.iata, a);
  if (a.icao && !byIcao.has(a.icao)) byIcao.set(a.icao, a);
}

export function airportByIata(code?: string | null): Airport | undefined {
  if (!code) return undefined;
  return byIata.get(code.trim().toUpperCase());
}
export function airportByIcao(code?: string | null): Airport | undefined {
  if (!code) return undefined;
  return byIcao.get(code.trim().toUpperCase());
}

/** Great-circle distance in km (EU261 Art 7(4) method). */
export function greatCircleKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371.0088;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Lightweight search for the airport autocomplete: matches IATA, city or name prefix. */
export function searchAirports(q: string, limit = 8): Airport[] {
  const s = q.trim().toLowerCase();
  if (s.length < 2) return [];
  const out: Airport[] = [];
  const exact = byIata.get(s.toUpperCase());
  if (exact) out.push(exact);
  for (const a of byIata.values()) {
    if (out.length >= limit) break;
    if (a === exact) continue;
    if (a.city.toLowerCase().startsWith(s) || a.name.toLowerCase().includes(s)) out.push(a);
  }
  return out;
}
