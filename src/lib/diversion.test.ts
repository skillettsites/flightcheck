import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { AdbFlight } from "./aerodatabox";
import { resolveDiversion } from "./diversion";

function t(utc: string, local: string) {
  return { utc, local };
}
function ap(iata: string, icao: string, countryCode: string) {
  return { iata, icao, countryCode, name: iata };
}
function flight(p: Partial<AdbFlight> & { departure: AdbFlight["departure"]; arrival: AdbFlight["arrival"] }): AdbFlight {
  return {
    number: "XX000",
    status: "Arrived",
    codeshareStatus: "IsOperator",
    isCargo: false,
    ...p,
  };
}

describe("resolveDiversion", () => {
  it("A: diversion plus same-day continuation to booked airport, delay from booked times", () => {
    const originToAlternate = flight({
      number: "FR9999",
      status: "Arrived",
      departure: {
        airport: ap("STN", "EGSS", "GB"),
        scheduledTime: t("2026-08-01 10:00Z", "2026-08-01 11:00+01:00"),
      },
      arrival: {
        airport: ap("GRO", "LEGE", "ES"),
        scheduledTime: t("2026-08-01 12:00Z", "2026-08-01 14:00+02:00"),
        revisedTime: t("2026-08-01 12:00Z", "2026-08-01 14:00+02:00"),
      },
    });
    const onwardToBooked = flight({
      number: "FR9999",
      status: "Arrived",
      departure: {
        airport: ap("GRO", "LEGE", "ES"),
        scheduledTime: t("2026-08-01 13:00Z", "2026-08-01 15:00+02:00"),
        revisedTime: t("2026-08-01 13:00Z", "2026-08-01 15:00+02:00"),
      },
      arrival: {
        airport: ap("BCN", "LEBL", "ES"),
        scheduledTime: t("2026-08-01 12:10Z", "2026-08-01 14:10+02:00"),
        revisedTime: t("2026-08-01 15:20Z", "2026-08-01 17:20+02:00"),
        runwayTime: t("2026-08-01 15:10Z", "2026-08-01 17:10+02:00"),
      },
    });
    const bookedSchedule = flight({
      number: "FR9999",
      status: "Expected",
      codeshareStatus: "IsCodeshared",
      departure: {
        airport: ap("STN", "EGSS", "GB"),
        scheduledTime: t("2026-08-01 10:00Z", "2026-08-01 11:00+01:00"),
      },
      arrival: {
        airport: ap("BCN", "LEBL", "ES"),
        scheduledTime: t("2026-08-01 12:10Z", "2026-08-01 14:10+02:00"),
      },
    });
    const r = resolveDiversion([originToAlternate, onwardToBooked, bookedSchedule], { departureIata: "STN" });
    assert.equal(r.diverted, true);
    assert.equal(r.bookedIata, "BCN");
    assert.equal(r.operatingIata, "GRO");
    assert.equal(r.finalArrivalUnverified, false);
    assert.equal(r.arrivalDelayMin, 190); // 12:10Z scheduled at BCN, 15:20Z gate
    assert.equal(r.actualBasis, "gate");
  });

  it("B: only diversion airport known → not on time; incomplete", () => {
    const onlyAlternate = flight({
      number: "BA602",
      status: "Arrived",
      departure: {
        airport: ap("LHR", "EGLL", "GB"),
        scheduledTime: t("2026-08-28 15:00Z", "2026-08-28 16:00+01:00"),
      },
      arrival: {
        airport: ap("TRS", "LIPQ", "IT"),
        scheduledTime: t("2026-08-28 18:49Z", "2026-08-28 20:49+02:00"),
        revisedTime: t("2026-08-28 18:49Z", "2026-08-28 20:49+02:00"),
      },
    });
    const r = resolveDiversion([onlyAlternate], { departureIata: "LHR", typicalArrivalIata: "VCE" });
    assert.equal(r.diverted, true);
    assert.equal(r.bookedIata, "VCE");
    assert.equal(r.operatingIata, "TRS");
    assert.equal(r.finalArrivalUnverified, true);
    assert.equal(r.arrivalDelayMin, null);
    assert.match(r.note, /could not verify/i);
  });

  it("status Diverted without typical dest is still a diversion, not on-time", () => {
    const f = flight({
      status: "Diverted",
      departure: { airport: ap("LHR", "EGLL", "GB"), scheduledTime: t("2026-08-28 15:00Z", "2026-08-28 16:00+01:00") },
      arrival: {
        airport: ap("TRS", "LIPQ", "IT"),
        scheduledTime: t("2026-08-28 18:49Z", "2026-08-28 20:49+02:00"),
        revisedTime: t("2026-08-28 18:49Z", "2026-08-28 20:49+02:00"),
      },
    });
    const r = resolveDiversion([f], {});
    assert.equal(r.diverted, true);
    assert.equal(r.finalArrivalUnverified, true);
    assert.equal(r.arrivalDelayMin, null);
  });

  it("C: on-time at booked airport is not a diversion", () => {
    const f = flight({
      departure: { airport: ap("LHR", "EGLL", "GB"), scheduledTime: t("2026-06-01 08:00Z", "2026-06-01 09:00+01:00") },
      arrival: {
        airport: ap("CDG", "LFPG", "FR"),
        scheduledTime: t("2026-06-01 09:20Z", "2026-06-01 11:20+02:00"),
        revisedTime: t("2026-06-01 09:15Z", "2026-06-01 11:15+02:00"),
      },
    });
    const r = resolveDiversion([f], { typicalArrivalIata: "CDG" });
    assert.equal(r.diverted, false);
    assert.equal(r.finalArrivalUnverified, false);
    assert.equal(r.arrivalDelayMin, -5);
  });
});
