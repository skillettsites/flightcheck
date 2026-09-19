import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import type { AdbFlight } from "./aerodatabox";
import { refineCheck, runCheck, type CheckDeps } from "./check";
import { type AirportDayDelay } from "./eurocontrol";

function t(utc: string, local: string) {
  return { utc, local };
}
function ap(iata: string, icao: string, countryCode: string) {
  return { iata, icao, countryCode, name: iata };
}
function flight(p: Partial<AdbFlight> & { departure: AdbFlight["departure"]; arrival: AdbFlight["arrival"] }): AdbFlight {
  return { number: "XX000", status: "Arrived", codeshareStatus: "IsOperator", isCargo: false, ...p };
}

const quiet: CheckDeps = {
  airportDay: async () => ({ covered: null, row: null }),
  weatherAround: async () => null,
  weatherWindow: async () => null,
  fetchTypicalArrivalIata: async () => null,
};

const results: { id: string; pass: boolean; reason: string }[] = [];
function record(id: string, pass: boolean, reason: string) {
  results.push({ id, pass, reason });
  assert.equal(pass, true, `${id}: ${reason}`);
}

describe("scenario suite A–L", { concurrency: false }, () => {
  it("A: diversion with verified booked arrival ≥3h is eligible", async () => {
    const fetched = [
      flight({
        number: "FR9999",
        departure: { airport: ap("STN", "EGSS", "GB"), scheduledTime: t("2026-08-01 10:00Z", "2026-08-01 11:00+01:00") },
        arrival: { airport: ap("GRO", "LEGE", "ES"), scheduledTime: t("2026-08-01 12:00Z", "2026-08-01 14:00+02:00"), revisedTime: t("2026-08-01 12:00Z", "2026-08-01 14:00+02:00") },
      }),
      flight({
        number: "FR9999",
        departure: { airport: ap("GRO", "LEGE", "ES"), scheduledTime: t("2026-08-01 13:00Z", "2026-08-01 15:00+02:00") },
        arrival: {
          airport: ap("BCN", "LEBL", "ES"),
          scheduledTime: t("2026-08-01 12:10Z", "2026-08-01 14:10+02:00"),
          revisedTime: t("2026-08-01 15:20Z", "2026-08-01 17:20+02:00"),
        },
      }),
      flight({
        number: "FR9999",
        status: "Expected",
        codeshareStatus: "IsCodeshared",
        departure: { airport: ap("STN", "EGSS", "GB"), scheduledTime: t("2026-08-01 10:00Z", "2026-08-01 11:00+01:00") },
        arrival: { airport: ap("BCN", "LEBL", "ES"), scheduledTime: t("2026-08-01 12:10Z", "2026-08-01 14:10+02:00") },
      }),
    ];
    const r = await runCheck({ flightNumber: "FR9999", date: "2026-08-01", disruption: "delay" }, { ...quiet, fetchFlight: async () => fetched });
    if ("error" in r) { record("A", false, r.error); return; }
    const ok = r.flight.diverted && r.flight.arrivalDelayMin !== null && r.flight.arrivalDelayMin >= 180 && r.eligibility.status === "eligible" && r.flight.arrival.airport?.iata === "BCN";
    record("A", !!ok, ok ? `diverted, delay ${r.flight.arrivalDelayMin} min at BCN, ${r.eligibility.status}` : JSON.stringify({ diverted: r.flight.diverted, delay: r.flight.arrivalDelayMin, elig: r.eligibility, arr: r.flight.arrival.airport?.iata }));
  });

  it("B: diversion with only alternate airport is incomplete, not on time", async () => {
    const fetched = [
      flight({
        number: "BA602",
        departure: { airport: ap("LHR", "EGLL", "GB"), scheduledTime: t("2026-08-28 15:00Z", "2026-08-28 16:00+01:00") },
        arrival: {
          airport: ap("TRS", "LIPQ", "IT"),
          scheduledTime: t("2026-08-28 18:49Z", "2026-08-28 20:49+02:00"),
          revisedTime: t("2026-08-28 18:49Z", "2026-08-28 20:49+02:00"),
        },
      }),
    ];
    const r = await runCheck(
      { flightNumber: "BA602", date: "2026-08-28", disruption: "delay" },
      { ...quiet, fetchFlight: async () => fetched, fetchTypicalArrivalIata: async () => "VCE" },
    );
    if ("error" in r) { record("B", false, r.error); return; }
    const onTimeLie = r.eligibility.status === "not_eligible" && /on time/i.test(r.eligibility.reason);
    const ok = r.flight.diverted && r.flight.finalArrivalUnverified && r.eligibility.status === "unclear" && r.flight.arrivalDelayMin === null && !onTimeLie;
    record("B", !!ok, ok ? "diverted, unverified final arrival, unclear (not on time)" : JSON.stringify({ diverted: r.flight.diverted, unverified: r.flight.finalArrivalUnverified, elig: r.eligibility, delay: r.flight.arrivalDelayMin }));
  });

  it("C: on-time arrival is not eligible", async () => {
    const fetched = [
      flight({
        number: "BA123",
        airline: { name: "British Airways", iata: "BA" },
        departure: { airport: ap("LHR", "EGLL", "GB"), scheduledTime: t("2026-06-01 08:00Z", "2026-06-01 09:00+01:00"), revisedTime: t("2026-06-01 08:00Z", "2026-06-01 09:00+01:00") },
        arrival: { airport: ap("CDG", "LFPG", "FR"), scheduledTime: t("2026-06-01 09:20Z", "2026-06-01 11:20+02:00"), revisedTime: t("2026-06-01 09:15Z", "2026-06-01 11:15+02:00") },
      }),
    ];
    const r = await runCheck({ flightNumber: "BA123", date: "2026-06-01", disruption: "delay" }, { ...quiet, fetchFlight: async () => fetched });
    if ("error" in r) { record("C", false, r.error); return; }
    const ok = !r.flight.diverted && r.eligibility.status === "not_eligible" && r.verdict === "no_claim";
    record("C", !!ok, ok ? "on-time, no_claim" : JSON.stringify(r.eligibility));
  });

  it("D: delay 179 not eligible, 180 eligible", async () => {
    async function delayOf(min: number) {
      const sched = "2026-06-01 10:00Z";
      const actMin = 10 * 60 + min;
      const hh = String(Math.floor(actMin / 60)).padStart(2, "0");
      const mm = String(actMin % 60).padStart(2, "0");
      const fetched = [
        flight({
          number: "BA321",
          airline: { name: "British Airways", iata: "BA" },
          departure: { airport: ap("LHR", "EGLL", "GB"), scheduledTime: t("2026-06-01 08:00Z", "2026-06-01 09:00+01:00") },
          arrival: { airport: ap("DUB", "EIDW", "IE"), scheduledTime: t(sched, "2026-06-01 11:00+01:00"), revisedTime: t(`2026-06-01 ${hh}:${mm}Z`, `2026-06-01 ${hh}:${mm}+00:00`) },
        }),
      ];
      return runCheck({ flightNumber: "BA321", date: "2026-06-01", disruption: "delay" }, { ...quiet, fetchFlight: async () => fetched });
    }
    const under = await delayOf(179);
    const on = await delayOf(180);
    if ("error" in under || "error" in on) { record("D", false, "runCheck error"); return; }
    const ok = under.eligibility.status === "not_eligible" && on.eligibility.status === "eligible" && on.flight.arrivalDelayMin === 180;
    record("D", !!ok, ok ? "179 not eligible, 180 eligible" : JSON.stringify({ under: under.eligibility, on: on.eligibility, d179: under.flight.arrivalDelayMin, d180: on.flight.arrivalDelayMin }));
  });

  it("E: cancellation notice paths do not regress", async () => {
    const fetched = [
      flight({
        number: "U21234",
        status: "Canceled",
        airline: { name: "easyJet", iata: "U2" },
        departure: { airport: ap("LGW", "EGKK", "GB"), scheduledTime: t("2026-06-01 08:00Z", "2026-06-01 09:00+01:00") },
        arrival: { airport: ap("AMS", "EHAM", "NL"), scheduledTime: t("2026-06-01 09:10Z", "2026-06-01 11:10+02:00") },
      }),
    ];
    const base = await runCheck({ flightNumber: "U21234", date: "2026-06-01", disruption: "delay" }, { ...quiet, fetchFlight: async () => fetched });
    if ("error" in base) { record("E", false, base.error); return; }
    const unknown = refineCheck(base, {});
    const fourteen = refineCheck(base, { noticeDays: 14 });
    const short = refineCheck(base, { noticeDays: 2, reroutedWithinLimits: false });
    const ok =
      unknown.eligibility.status === "unclear" &&
      fourteen.eligibility.status === "not_eligible" &&
      short.eligibility.status === "eligible" &&
      base.flight.cancelled;
    record("E", !!ok, ok ? "cancel: unclear / 14-day no / short notice yes" : JSON.stringify({ unknown: unknown.eligibility, fourteen: fourteen.eligibility, short: short.eligibility }));
  });

  it("F: denied boarding path does not regress", async () => {
    const fetched = [
      flight({
        number: "BA111",
        airline: { name: "British Airways", iata: "BA" },
        departure: { airport: ap("LHR", "EGLL", "GB"), scheduledTime: t("2026-06-01 08:00Z", "2026-06-01 09:00+01:00") },
        arrival: { airport: ap("MAD", "LEMD", "ES"), scheduledTime: t("2026-06-01 10:20Z", "2026-06-01 12:20+02:00"), revisedTime: t("2026-06-01 10:20Z", "2026-06-01 12:20+02:00") },
      }),
    ];
    const base = await runCheck({ flightNumber: "BA111", date: "2026-06-01", disruption: "delay" }, { ...quiet, fetchFlight: async () => fetched });
    if ("error" in base) { record("F", false, base.error); return; }
    const bumped = refineCheck(base, { deniedBoarding: true });
    const ok = base.verdict === "no_claim" && bumped.eligibility.status === "eligible" && bumped.input.disruption === "denied_boarding" && /overbooking/i.test(bumped.eligibility.reason);
    record("F", !!ok, ok ? "denied boarding flips to eligible" : JSON.stringify(bumped.eligibility));
  });

  it("G: Emirates DXB→LHR is not covered", async () => {
    const fetched = [
      flight({
        number: "EK1",
        airline: { name: "Emirates", iata: "EK" },
        departure: { airport: ap("DXB", "OMDB", "AE"), scheduledTime: t("2026-06-01 08:00Z", "2026-06-01 12:00+04:00") },
        arrival: { airport: ap("LHR", "EGLL", "GB"), scheduledTime: t("2026-06-01 15:00Z", "2026-06-01 16:00+01:00"), revisedTime: t("2026-06-01 19:00Z", "2026-06-01 20:00+01:00") },
      }),
    ];
    const r = await runCheck({ flightNumber: "EK1", date: "2026-06-01", disruption: "delay" }, { ...quiet, fetchFlight: async () => fetched });
    if ("error" in r) { record("G", false, r.error); return; }
    const ok = r.regimes.length === 0 && r.eligibility.status === "not_eligible";
    record("G", !!ok, ok ? "no UK261/EU261 on EK DXB-LHR" : JSON.stringify({ regimes: r.regimes, elig: r.eligibility }));
  });

  it("H: UK carrier outbound from UK is covered", async () => {
    const fetched = [
      flight({
        number: "BA117",
        airline: { name: "British Airways", iata: "BA" },
        departure: { airport: ap("LHR", "EGLL", "GB"), scheduledTime: t("2026-06-01 09:00Z", "2026-06-01 10:00+01:00") },
        arrival: { airport: ap("JFK", "KJFK", "US"), scheduledTime: t("2026-06-01 17:00Z", "2026-06-01 13:00-04:00"), revisedTime: t("2026-06-01 21:00Z", "2026-06-01 17:00-04:00") },
      }),
    ];
    const r = await runCheck({ flightNumber: "BA117", date: "2026-06-01", disruption: "delay" }, { ...quiet, fetchFlight: async () => fetched });
    if ("error" in r) { record("H", false, r.error); return; }
    const ok = r.regimes.some((x) => x.regime === "UK261") && r.eligibility.status === "eligible";
    record("H", !!ok, ok ? "UK261 on BA LHR-JFK with 4h delay" : JSON.stringify({ regimes: r.regimes, elig: r.eligibility }));
  });

  it("I: distance bands from km on a real check", async () => {
    const mk = async (arr: [string, string, string], km: number) => {
      const fetched = [
        flight({
          number: "BA500",
          airline: { name: "British Airways", iata: "BA" },
          greatCircleDistance: { km, mile: km * 0.62 },
          departure: { airport: ap("LHR", "EGLL", "GB"), scheduledTime: t("2026-06-01 08:00Z", "2026-06-01 09:00+01:00") },
          arrival: { airport: ap(arr[0], arr[1], arr[2]), scheduledTime: t("2026-06-01 12:00Z", "2026-06-01 13:00+01:00"), revisedTime: t("2026-06-01 16:00Z", "2026-06-01 17:00+01:00") },
        }),
      ];
      return runCheck({ flightNumber: "BA500", date: "2026-06-01", disruption: "delay" }, { ...quiet, fetchFlight: async () => fetched });
    };
    const short = await mk(["DUB", "EIDW", "IE"], 464);
    const mid = await mk(["ATH", "LGAV", "GR"], 2400);
    const longHaul = await mk(["JFK", "KJFK", "US"], 5500);
    if ("error" in short || "error" in mid || "error" in longHaul) { record("I", false, "runCheck error"); return; }
    const amounts = [short.bands[0]?.amount, mid.bands[0]?.amount, longHaul.bands[0]?.amount];
    const ok = amounts[0] === 220 && amounts[1] === 350 && amounts[2] === 520;
    record("I", !!ok, ok ? "£220 / £350 / £520" : JSON.stringify(amounts));
  });

  it("J: weather/ATFM evidence attaches without inventing causes", async () => {
    const row: AirportDayDelay = { icao: "EGKK", day: "2026-06-27", arrivals: 315, delay_min: 5876, delayed_flights: 97, delayed_15: 97, causes: { W: 5876 } };
    const fetched = [
      flight({
        number: "U28160",
        airline: { name: "easyJet", iata: "U2" },
        departure: { airport: ap("LJU", "LJLJ", "SI"), scheduledTime: t("2026-06-27 14:00Z", "2026-06-27 16:00+02:00") },
        arrival: { airport: ap("LGW", "EGKK", "GB"), scheduledTime: t("2026-06-27 16:50Z", "2026-06-27 17:50+01:00"), runwayTime: t("2026-06-27 22:58Z", "2026-06-27 23:58+01:00") },
      }),
    ];
    const r = await runCheck(
      { flightNumber: "U28160", date: "2026-06-27", disruption: "delay" },
      {
        ...quiet,
        fetchFlight: async () => fetched,
        airportDay: async (icao) => icao === "EGKK" ? { covered: { icao: "EGKK", name: "London Gatwick", state: "GB", first_day: "2019-01-01", last_day: "2026-08-01" }, row } : { covered: null, row: null },
        weatherAround: async () => null,
        weatherWindow: async () => ({ station: "EGKK", observations: 1, windowUtc: { from: "a", to: "b" }, minVisibilityM: 10000, maxGustKt: null, maxWindKt: 3, phenomena: [], severity: "clear", sampleMetar: "EGKK 271250Z 13003KT CAVOK" }),
      },
    );
    if ("error" in r) { record("J", false, r.error); return; }
    const causes = r.evidence.arrivalAirport?.causes ?? [];
    const invented = causes.some((c) => c.code !== "W");
    const ok = causes.length === 1 && causes[0].code === "W" && !invented && r.defenceRisk.level !== "unknown";
    record("J", !!ok, ok ? `ATFM weather cause attached, defence ${r.defenceRisk.level}` : JSON.stringify({ causes, defence: r.defenceRisk }));
  });

  it("K: unknown callsign / missing flight is an honest miss", async () => {
    const r = await runCheck({ flightNumber: "ZZ9999", date: "2026-06-01", disruption: "delay" }, { ...quiet, fetchFlight: async () => ({ error: "No flight found for that number and date.", status: 404 }) });
    const ok = "error" in r && r.status === 404 && /no flight found/i.test(r.error);
    record("K", !!ok, ok ? "404 no flight found" : JSON.stringify(r));
  });

  it("L: documented U28160 2026-06-27 sample still claims £220", async () => {
    // Times taken from the site's published sample board (scheduled 17:50, touchdown 23:58 local = 6h 08m). Not a live AeroDataBox dump.
    const fetched = [
      flight({
        number: "U28160",
        airline: { name: "easyJet UK", iata: "U2" },
        greatCircleDistance: { km: 1207, mile: 750 },
        departure: { airport: ap("LJU", "LJLJ", "SI"), scheduledTime: t("2026-06-27 14:00Z", "2026-06-27 16:00+02:00") },
        arrival: { airport: ap("LGW", "EGKK", "GB"), scheduledTime: t("2026-06-27 16:50Z", "2026-06-27 17:50+01:00"), runwayTime: t("2026-06-27 22:58Z", "2026-06-27 23:58+01:00") },
      }),
    ];
    const r = await runCheck({ flightNumber: "U28160", date: "2026-06-27", disruption: "delay" }, { ...quiet, fetchFlight: async () => fetched });
    if ("error" in r) { record("L", false, r.error); return; }
    const uk = r.bands.find((b) => b.regime === "UK261");
    const ok = r.flight.arrivalDelayMin === 368 && r.eligibility.status === "eligible" && uk?.amount === 220 && (r.verdict === "claim" || r.verdict === "borderline");
    record("L", !!ok, ok ? `delay ${r.flight.arrivalDelayMin} min, £220, verdict ${r.verdict}` : JSON.stringify({ delay: r.flight.arrivalDelayMin, bands: r.bands, elig: r.eligibility, verdict: r.verdict }));
  });

  it("writes PASS/FAIL markdown", () => {
    const lines = ["# FlightDelayCheck scenario suite", "", `Run: ${new Date().toISOString()}`, "", "| ID | Result | Reason |", "|----|--------|--------|"];
    for (const r of results) lines.push(`| ${r.id} | ${r.pass ? "PASS" : "FAIL"} | ${r.reason.replace(/\|/g, "/")} |`);
    const failed = results.filter((x) => !x.pass);
    lines.push("", failed.length ? `Failed: ${failed.map((f) => f.id).join(", ")}` : "All required scenarios passed.");
    const body = lines.join("\n") + "\n";
    writeFileSync("/workspace/fdc-scenarios-last.md", body);
    writeFileSync("/workspace/fdc-diversion-scenarios-last.md", body);
    assert.equal(results.length, 12);
    assert.equal(failed.length, 0);
  });
});
