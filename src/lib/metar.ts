// Airport weather observations (METAR) from the Iowa Environmental Mesonet ASOS archive.
// Free, no key. https://mesonet.agron.iastate.edu/request/download.phtml
// We pull a window around the scheduled time and summarise the conditions an airline
// would point to (visibility, gusts, thunderstorms, snow, freezing precipitation, fog).

export interface WeatherSummary {
  station: string;
  observations: number;
  windowUtc: { from: string; to: string };
  minVisibilityM: number | null;
  maxGustKt: number | null;
  maxWindKt: number | null;
  phenomena: string[]; // e.g. ["Thunderstorm", "Snow"]
  severity: "clear" | "marginal" | "adverse" | "unknown";
  sampleMetar: string | null; // the worst-looking raw METAR in the window, for the evidence appendix
}

const PHENOMENA: [RegExp, string][] = [
  [/TS/, "Thunderstorm"], [/\+?SN|SG|BLSN/, "Snow"], [/FZ(RA|DZ|FG)/, "Freezing precipitation"], [/\bFG\b|BCFG|MIFG|PRFG/, "Fog"],
  [/\+RA|\+SHRA/, "Heavy rain"], [/GR|GS/, "Hail"], [/FC/, "Funnel cloud"], [/SQ/, "Squall"], [/DS|SS/, "Dust or sand storm"], [/VA/, "Volcanic ash"],
];

function fmt(d: Date) {
  return d.toISOString().slice(0, 16).replace("T", " ") + "Z";
}

export async function weatherAround(stationIcao: string, centreUtc: Date, hoursEachSide = 3): Promise<WeatherSummary | null> {
  const from = new Date(centreUtc.getTime() - hoursEachSide * 3600_000);
  const to = new Date(centreUtc.getTime() + hoursEachSide * 3600_000);
  return weatherWindow(stationIcao, from, to);
}

/** Explicit window: for arrivals we look from 4h before the scheduled slot to 1h after the actual one. */
export async function weatherWindow(stationIcao: string, from: Date, to: Date): Promise<WeatherSummary | null> {
  if (!stationIcao) return null;
  const p = new URLSearchParams({
    station: stationIcao, data: "sknt,gust,vsby,wxcodes,metar",
    year1: String(from.getUTCFullYear()), month1: String(from.getUTCMonth() + 1), day1: String(from.getUTCDate()),
    year2: String(to.getUTCFullYear()), month2: String(to.getUTCMonth() + 1), day2: String(to.getUTCDate()),
    tz: "Etc/UTC", format: "onlycomma", latlon: "no", missing: "M", trace: "T", direct: "no", report_type: "3",
  });
  // IEM treats the end date as exclusive, so always request through the day after the window ends.
  const next = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate() + 1));
  p.set("year2", String(next.getUTCFullYear())); p.set("month2", String(next.getUTCMonth() + 1)); p.set("day2", String(next.getUTCDate()));
  // IEM throttles bursts (429/503). One request at a time, short backoff, then give up quietly.
  // Observations for a day that ended more than 48 hours ago never change, so let Next keep them for 30 days.
  const settled = Date.now() - next.getTime() > 2 * 86_400_000;
  let text: string | null = null;
  for (let attempt = 0; attempt < 3 && text === null; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 1200 * attempt));
    try {
      const res = await fetch(`https://mesonet.agron.iastate.edu/cgi-bin/request/asos.py?${p.toString()}`, { signal: AbortSignal.timeout(20000), ...(settled ? { next: { revalidate: 2592000 } } : { cache: "no-store" as const }) });
      if (res.status === 429 || res.status === 503) continue;
      if (!res.ok) { console.error("metar fetch not ok", stationIcao, res.status); return null; }
      text = await res.text();
    } catch (e) {
      console.error("metar fetch failed", stationIcao, (e as Error).message);
    }
  }
  if (text === null) return null;
  const lines = text.trim().split(/\r?\n/).filter((l) => l && !l.startsWith("#"));
  if (lines.length < 2) return { station: stationIcao, observations: 0, windowUtc: { from: fmt(from), to: fmt(to) }, minVisibilityM: null, maxGustKt: null, maxWindKt: null, phenomena: [], severity: "unknown", sampleMetar: null };
  const header = lines[0].split(",");
  const ix = (k: string) => header.indexOf(k);
  const iValid = ix("valid"), iSknt = ix("sknt"), iGust = ix("gust"), iVsby = ix("vsby"), iWx = ix("wxcodes"), iMetar = ix("metar");
  let minVis: number | null = null, maxGust: number | null = null, maxWind: number | null = null;
  const phen = new Set<string>();
  let worst: { score: number; metar: string } | null = null;
  let n = 0;
  for (const line of lines.slice(1)) {
    const c = line.split(",");
    const valid = c[iValid] ? new Date(c[iValid].replace(" ", "T") + "Z") : null;
    if (!valid || valid < from || valid > to) continue;
    n++;
    const vis = parseFloat(c[iVsby]); const gust = parseFloat(c[iGust]); const wind = parseFloat(c[iSknt]);
    let score = 0;
    if (!isNaN(vis)) { const m = Math.round(vis * 1609.34); if (minVis === null || m < minVis) minVis = m; if (m < 1500) score += 2; else if (m < 5000) score += 1; }
    if (!isNaN(gust)) { if (maxGust === null || gust > maxGust) maxGust = gust; if (gust >= 40) score += 2; else if (gust >= 30) score += 1; }
    if (!isNaN(wind)) { if (maxWind === null || wind > maxWind) maxWind = wind; }
    const wx = c[iWx] || "";
    for (const [re, label] of PHENOMENA) if (re.test(wx)) { phen.add(label); score += label === "Thunderstorm" || label === "Snow" || label === "Freezing precipitation" ? 2 : 1; }
    const metar = c[iMetar] || "";
    if (!worst || score > worst.score) worst = { score, metar };
  }
  const severity: WeatherSummary["severity"] = n === 0 ? "unknown" : (worst && worst.score >= 3) ? "adverse" : (worst && worst.score >= 1) ? "marginal" : "clear";
  return { station: stationIcao, observations: n, windowUtc: { from: fmt(from), to: fmt(to) }, minVisibilityM: minVis, maxGustKt: maxGust, maxWindKt: maxWind, phenomena: [...phen], severity, sampleMetar: worst?.metar ?? null };
}
