"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Disruption = "delay" | "cancellation" | "denied_boarding";

export default function CheckForm({ compact = false, defaultDate = "" }: { compact?: boolean; defaultDate?: string }) {
  const router = useRouter();
  const [flight, setFlight] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [disruption, setDisruption] = useState<Disruption>("delay");
  const [noticeDays, setNoticeDays] = useState<string>("");
  const [rerouted, setRerouted] = useState<string>("");
  const [departureIata, setDepartureIata] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("flight")) setFlight(q.get("flight") as string);
    if (q.get("date")) setDate(q.get("date") as string);
    const d = q.get("disruption");
    if (d === "cancellation" || d === "denied_boarding" || d === "delay") setDisruption(d);
  }, []);
  const maxDate = new Date().toISOString().slice(0, 10);
  const minDate = new Date(Date.now() - 365 * 86_400_000).toISOString().slice(0, 10);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const body: Record<string, unknown> = { flightNumber: flight, date, disruption };
      if (departureIata.trim()) body.departureIata = departureIata.trim();
      if (disruption === "cancellation") {
        body.noticeDays = noticeDays === "" ? null : Number(noticeDays);
        body.reroutedWithinLimits = rerouted === "" ? null : rerouted === "yes";
      }
      const res = await fetch("/api/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong."); setBusy(false); return; }
      router.push(`/check/${data.token}`);
    } catch {
      setError("Could not reach the flight record service. Please try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card" style={{ padding: compact ? 18 : 24, display: "grid", gap: 14 }} aria-label="Check a flight">
      <div className="grid-2" style={{ gap: 14 }}>
        <div className="field">
          <label htmlFor="flight">Flight number</label>
          <input id="flight" className="input mono" placeholder="e.g. BA117, FR8022, U21234" value={flight} onChange={(e) => setFlight(e.target.value)} required autoComplete="off" inputMode="text" />
        </div>
        <div className="field">
          <label htmlFor="date">Date of departure</label>
          <input id="date" className="input mono" type="date" value={date} min={minDate} max={maxDate} onChange={(e) => setDate(e.target.value)} required />
        </div>
      </div>
      <div className="field">
        <span className="small" style={{ fontWeight: 600, color: "var(--ink-2)" }}>What happened?</span>
        <div className="seg" role="group" aria-label="Disruption type">
          {([["delay", "Delayed"], ["cancellation", "Cancelled"], ["denied_boarding", "Denied boarding"]] as [Disruption, string][]).map(([v, l]) => (
            <button key={v} type="button" aria-pressed={disruption === v} onClick={() => setDisruption(v)}>{l}</button>
          ))}
        </div>
      </div>
      {disruption === "cancellation" && (
        <div className="grid-2" style={{ gap: 14 }}>
          <div className="field">
            <label htmlFor="notice">How many days before departure were you told?</label>
            <select id="notice" className="input" value={noticeDays} onChange={(e) => setNoticeDays(e.target.value)}>
              <option value="">Not sure</option>
              <option value="0">On the day or after</option>
              <option value="3">1 to 6 days before</option>
              <option value="10">7 to 13 days before</option>
              <option value="14">14 or more days before</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="reroute">Were you re-routed close to the original times?</label>
            <select id="reroute" className="input" value={rerouted} onChange={(e) => setRerouted(e.target.value)}>
              <option value="">Not sure / no alternative offered</option>
              <option value="yes">Yes, within a couple of hours of the original times</option>
              <option value="no">No, much later or not at all</option>
            </select>
          </div>
        </div>
      )}
      <details style={{ borderTop: 0, padding: 0 }}>
        <summary className="small" style={{ fontFamily: "var(--font-body)", fontWeight: 600, color: "var(--ink-3)" }}>Flight number used for more than one leg that day?</summary>
        <div className="field" style={{ marginTop: 8 }}>
          <label htmlFor="dep">Departure airport code (optional)</label>
          <input id="dep" className="input mono" placeholder="e.g. LHR" maxLength={3} value={departureIata} onChange={(e) => setDepartureIata(e.target.value)} />
        </div>
      </details>
      {error && <p role="alert" className="small" style={{ color: "var(--stop)", margin: 0 }}>{error}</p>}
      <button className="btn btn-accent" type="submit" disabled={busy} style={{ justifySelf: "start", minWidth: 220 }}>
        {busy ? "Checking the flight record…" : "Check my flight, free"}
      </button>
      <p className="small muted" style={{ margin: 0 }}>Flights from the last 12 months. No account, no card, no airline contacted.</p>
    </form>
  );
}
