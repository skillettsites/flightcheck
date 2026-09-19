import { sbRpc, sbSelect, sbSelectAll, sbSelectCached } from "./supabase";

// The Eurocontrol record is monthly, so every read on the public pages can sit in the ISR cache for a day.
const DAY = 86400;
import type { AirportDayDelay } from "./eurocontrol";

export interface CoveredAirportRow {
  icao: string;
  name: string;
  state: string;
  first_day: string;
  last_day: string;
  slug: string | null;
  iata: string | null;
  country: string | null;
  city: string | null;
}

// Thresholds that make an airport-day worth a page of its own. UK and Ireland get a lower bar
// because that is where the site's readers are; elsewhere only genuinely bad days qualify.
export const UKIE_MIN_DELAY = 300;
export const EU_MIN_DELAY = 1000;

export function isSignificant(row: { icao: string; delay_min: number; delayed_15: number | null }): boolean {
  const ukie = row.icao.startsWith("EG") || row.icao.startsWith("EI");
  return row.delay_min >= (ukie ? UKIE_MIN_DELAY : EU_MIN_DELAY) || (row.delayed_15 ?? 0) >= 40;
}

export async function airportBySlug(slug: string): Promise<CoveredAirportRow | null> {
  const rows = await sbSelect<CoveredAirportRow>("fcc_airports_covered", `slug=eq.${encodeURIComponent(slug)}&limit=1`, DAY);
  return rows[0] ?? null;
}

export async function airportByIcaoRow(icao: string): Promise<CoveredAirportRow | null> {
  const rows = await sbSelect<CoveredAirportRow>("fcc_airports_covered", `icao=eq.${encodeURIComponent(icao)}&limit=1`, DAY);
  return rows[0] ?? null;
}

export async function allCoveredAirports(): Promise<CoveredAirportRow[]> {
  return sbSelect<CoveredAirportRow>("fcc_airports_covered", `select=*&order=state.asc,name.asc&limit=1000`, DAY);
}

export async function worstDays(icao: string, limit = 30): Promise<AirportDayDelay[]> {
  return sbRpc<AirportDayDelay>("fcc_airport_worst_days", { p_icao: icao, p_limit: limit }, DAY);
}

export async function recentDays(icao: string, limit = 60): Promise<AirportDayDelay[]> {
  return sbSelect<AirportDayDelay>("fcc_apt_delay_daily", `icao=eq.${encodeURIComponent(icao)}&order=day.desc&limit=${limit}`, DAY);
}

export async function dayRow(icao: string, day: string): Promise<AirportDayDelay | null> {
  const rows = await sbSelect<AirportDayDelay>("fcc_apt_delay_daily", `icao=eq.${encodeURIComponent(icao)}&day=eq.${day}&limit=1`, DAY);
  return rows[0] ?? null;
}

export async function dayAcrossAirports(day: string, limit = 12): Promise<AirportDayDelay[]> {
  return sbRpc<AirportDayDelay>("fcc_day_across_airports", { p_day: day, p_limit: limit }, DAY);
}

/** Worst days network-wide in a window, for the index page and the home page block. */
export async function worstDaysSince(sinceDay: string, minDelay: number, limit = 40): Promise<AirportDayDelay[]> {
  return sbSelect<AirportDayDelay>("fcc_apt_delay_daily", `day=gte.${sinceDay}&delay_min=gte.${minDelay}&order=delay_min.desc&limit=${limit}`, DAY);
}

/** Home page tape: the worst recent airport-days with the airport names, cached for an hour. */
export async function tapeDays(sinceDay: string, limit = 24): Promise<(AirportDayDelay & { airport: CoveredAirportRow })[]> {
  const [days, airports] = await Promise.all([
    sbSelectCached<AirportDayDelay>("fcc_apt_delay_daily", `day=gte.${sinceDay}&delay_min=gte.${UKIE_MIN_DELAY}&order=delay_min.desc&limit=${limit * 3}`, 3600),
    sbSelectCached<CoveredAirportRow>("fcc_airports_covered", `select=*&limit=1000`, 3600),
  ]);
  const byIcao = new Map(airports.map((a) => [a.icao, a]));
  return days
    .filter((d) => isSignificant(d) && byIcao.get(d.icao)?.slug)
    .map((d) => ({ ...d, airport: byIcao.get(d.icao) as CoveredAirportRow }))
    .slice(0, limit);
}

/** Significant days for the sitemap: UK/IE >= 300 min, elsewhere >= 1000 min. */
export async function significantDays(): Promise<{ icao: string; day: string }[]> {
  const [ukie, eu] = await Promise.all([
    sbSelectAll<{ icao: string; day: string }>("fcc_apt_delay_daily", `select=icao,day&delay_min=gte.${UKIE_MIN_DELAY}&or=(icao.like.EG*,icao.like.EI*)&order=day.desc,icao.asc`),
    sbSelectAll<{ icao: string; day: string }>("fcc_apt_delay_daily", `select=icao,day&delay_min=gte.${EU_MIN_DELAY}&not.or=(icao.like.EG*,icao.like.EI*)&order=day.desc,icao.asc`),
  ]);
  return [...ukie, ...eu];
}

export function displayName(a: CoveredAirportRow): string {
  // "London - Gatwick" -> "London Gatwick"; "Leeds - Bradford Airport" -> "Leeds Bradford"
  return a.name.replace(/\s*-\s*/g, " ").replace(/\s+Airport$/i, "").trim();
}

export function shortName(a: CoveredAirportRow): string {
  // The word people use: "Gatwick", "Heathrow", "Manchester", "Dublin"
  const n = displayName(a);
  const m = n.match(/^London (.+)$/);
  if (m) return m[1];
  return n.replace(/\s+(International|Intl)$/i, "");
}

export function longDate(day: string): string {
  const d = new Date(day + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
export function mediumDate(day: string): string {
  const d = new Date(day + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
