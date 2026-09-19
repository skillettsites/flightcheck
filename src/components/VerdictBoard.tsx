import type { CheckResult } from "@/lib/check";
import { fmtMin } from "@/lib/eu261";
import { countryName } from "@/lib/regions";

function local(s: string | null) {
  if (!s) return "n/a";
  // "2026-09-15 11:10-04:00" -> "11:10 (15 Sep)"
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}:\d{2})/);
  if (!m) return s;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${m[4]} · ${parseInt(m[3], 10)} ${months[parseInt(m[2], 10) - 1]}`;
}

export default function VerdictBoard({ r }: { r: CheckResult }) {
  const tone = r.verdict === "claim" ? "go" : r.verdict === "borderline" ? "warn" : r.verdict === "no_claim" ? "stop" : "warn";
  const label = r.verdict === "claim" ? "Claim" : r.verdict === "borderline" ? "Claim, expect pushback" : r.verdict === "no_claim" ? "No claim" : "Needs one detail";
  const dep = r.flight.departure, arr = r.flight.arrival;
  const band = r.bands[0];
  return (
    <section className="board" aria-labelledby="verdict">
      <div className="board-head">
        <div>
          <p className="eyebrow" style={{ margin: 0 }}>{r.flight.airline.name} · {r.input.date}</p>
          <div className="flightno">{r.flight.number}</div>
        </div>
        <span className={`pill ${tone}`}>{label}</span>
      </div>
      <p id="verdict" className="verdict-line">{r.headline}</p>
      <p className="small" style={{ color: "#c9d1de", margin: "0 0 12px", maxWidth: "70ch" }}>{r.eligibility.reason}</p>

      <div className="board-row"><span className="board-key">Route</span><span className="board-val dim">{dep.airport?.iata ?? dep.icao} → {arr.airport?.iata ?? arr.icao}</span></div>
      <div className="board-row"><span className="board-key">Scheduled arrival</span><span className="board-val dim">{local(arr.scheduledLocal)}</span></div>
      <div className="board-row"><span className="board-key">{r.flight.cancelled ? "Status" : arr.actualBasis === "runway" ? "Actual touchdown" : "Actual arrival (gate)"}</span><span className="board-val">{r.flight.cancelled ? "CANCELLED" : local(arr.actualLocal)}</span></div>
      {!r.flight.cancelled && <div className="board-row"><span className="board-key">Arrival delay</span><span className="board-val">{r.flight.arrivalDelayMin !== null ? fmtMin(r.flight.arrivalDelayMin) : "n/a"}</span></div>}
      <div className="board-row"><span className="board-key">Distance · band</span><span className="board-val dim">{r.flight.distanceKm ? `${r.flight.distanceKm.toLocaleString()} km` : "n/a"}{band ? ` · ${band.bandLabel}` : ""}</span></div>
      <div className="board-row"><span className="board-key">Regulation</span><span className="board-val dim">{r.regimes.length ? r.regimes.map((x) => x.regime).join(" + ") : "none applies"}</span></div>
      {band && <div className="board-row"><span className="board-key">Per passenger</span><span className="board-val">{band.currency === "GBP" ? "£" : "€"}{band.amount}{band.reducedAmount && r.flight.arrivalDelayMin !== null && r.flight.arrivalDelayMin < 240 && r.flight.arrivalDelayMin >= 180 ? ` (${band.currency === "GBP" ? "£" : "€"}${band.reducedAmount} if re-routed)` : ""}</span></div>}
      <div className="board-row"><span className="board-key">Airline defence risk</span><span className={`board-val ${r.defenceRisk.level === "low" ? "" : "dim"}`}>{r.defenceRisk.level.toUpperCase()}</span></div>
      {r.regimes.length > 0 && (
        <p className="small" style={{ color: "#8a96ad", margin: "12px 0 0" }}>
          Why this regulation: {r.regimes.map((x) => x.basis).join("; ")}. Airline: {r.flight.airline.ukOrEuCarrier === null ? "carrier nationality not on file, verdict assumes departure-airport rules only" : r.flight.airline.ukOrEuCarrier ? `a ${countryName(r.flight.airline.country!)} carrier` : `a ${countryName(r.flight.airline.country!)} carrier, so only departure-airport rules apply`}.
        </p>
      )}
      <p className="small" style={{ color: "#6f7d95", margin: "10px 0 0" }}>Flight record via AeroDataBox. Times shown in local airport time.{arr.actualBasis === "runway" ? " Gate time was not recorded; touchdown is shown and the doors typically open 5 to 10 minutes later." : ""}</p>
    </section>
  );
}
