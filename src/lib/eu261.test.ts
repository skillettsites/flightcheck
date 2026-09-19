import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { bandFor, cancellationEligibility, coverage, delayEligibility } from "./eu261";

describe("delayEligibility threshold", () => {
  it("C: on time is not eligible", () => {
    const r = delayEligibility(0);
    assert.equal(r.status, "not_eligible");
    assert.match(r.reason, /on time or early/i);
  });
  it("D: 2h59 is not eligible; 3h00 is eligible", () => {
    const under = delayEligibility(179);
    const on = delayEligibility(180);
    assert.equal(under.status, "not_eligible");
    assert.equal(on.status, "eligible");
  });
});

describe("cancellationEligibility", () => {
  it("E: unknown notice is unclear; 14+ days not eligible; under 7 without reroute is eligible", () => {
    assert.equal(cancellationEligibility({ noticeDays: null, rerouteOfferedWithinLimits: null }).status, "unclear");
    assert.equal(cancellationEligibility({ noticeDays: 14, rerouteOfferedWithinLimits: null }).status, "not_eligible");
    assert.equal(cancellationEligibility({ noticeDays: 3, rerouteOfferedWithinLimits: false }).status, "eligible");
    assert.equal(cancellationEligibility({ noticeDays: 3, rerouteOfferedWithinLimits: true }).status, "not_eligible");
  });
});

describe("coverage and bands", () => {
  it("G: non-UK/EU carrier into the UK is not covered", () => {
    const r = coverage({ depCountry: "AE", arrCountry: "GB", carrierCountry: "AE" });
    assert.equal(r.length, 0);
  });
  it("H: UK/EU carrier outbound from the UK is covered by UK261", () => {
    const r = coverage({ depCountry: "GB", arrCountry: "US", carrierCountry: "GB" });
    assert.ok(r.some((x) => x.regime === "UK261"));
  });
  it("I: UK261 distance bands £220 / £350 / £520", () => {
    assert.equal(bandFor("UK261", 1200, false).amount, 220);
    assert.equal(bandFor("UK261", 2000, false).amount, 350);
    assert.equal(bandFor("UK261", 4000, false).amount, 520);
  });
});
