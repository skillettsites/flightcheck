"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CheckForm({ compact = false, defaultDate = "" }: { compact?: boolean; defaultDate?: string }) {
  const router = useRouter();
  const [flight, setFlight] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [departureIata, setDepartureIata] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("flight")) setFlight(q.get("flight") as string);
    if (q.get("date")) setDate(q.get("date") as string);
  }, []);
  const maxDate = new Date().toISOString().slice(0, 10);
  const minDate = new Date(Date.now() - 365 * 86_400_000).toISOString().slice(0, 10);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const body: Record<string, unknown> = { flightNumber: flight, date };
      if (departureIata.trim()) body.departureIata = departureIata.trim();
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
    <form onSubmit={submit} className="card" id={compact ? undefined : "check"} style={{ padding: compact ? 20 : 24, display: "grid", gap: 16, borderRadius: 24, boxShadow: "var(--shadow-lg)" }} aria-label="Check a flight">
      <div className="grid-2 check-fields" style={{ gap: 14 }}>
        <div className="field">
          <label htmlFor="flight">Flight number</label>
          <input id="flight" className="input" placeholder="e.g. BA117" value={flight} onChange={(e) => setFlight(e.target.value)} required autoComplete="off" inputMode="text" />
        </div>
        <div className="field">
          <label htmlFor="date">Flight date</label>
          <input id="date" className="input" type="date" value={date} min={minDate} max={maxDate} onChange={(e) => setDate(e.target.value)} required />
        </div>
      </div>
      <details className="plain">
        <summary className="small muted">Same flight number twice that day? Add the departure code</summary>
        <div className="field" style={{ marginTop: 10, maxWidth: 220 }}>
          <label htmlFor="dep">Departure airport code</label>
          <input id="dep" className="input mono" placeholder="LHR" maxLength={3} value={departureIata} onChange={(e) => setDepartureIata(e.target.value)} />
        </div>
      </details>
      {error && <p role="alert" className="small" style={{ color: "var(--stop)", margin: 0 }}>{error}</p>}
      <button className="btn btn-accent" type="submit" disabled={busy} style={{ width: "100%" }}>
        {busy ? "Checking…" : "Check flight"}
      </button>
      <p className="small muted" style={{ margin: 0, textAlign: "center" }}>Free. No account. The airline is not contacted.</p>
    </form>
  );
}
