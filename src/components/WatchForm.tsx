"use client";

import { useState } from "react";

interface Row { flightNumber: string; date: string; departureIata: string; passengers: number }
const blank = (): Row => ({ flightNumber: "", date: "", departureIata: "", passengers: 1 });

export default function WatchForm({ token, email: initialEmail = "", compact = false, onDone }: { token?: string; email?: string; compact?: boolean; onDone?: () => void }) {
  const [email, setEmail] = useState(initialEmail);
  const [rows, setRows] = useState<Row[]>([blank()]);
  const [paste, setPaste] = useState("");
  const [parsing, setParsing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const minDate = new Date(Date.now() - 300 * 86_400_000).toISOString().slice(0, 10);
  const maxDate = new Date(Date.now() + 365 * 86_400_000).toISOString().slice(0, 10);

  function set(i: number, patch: Partial<Row>) { setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x))); }

  async function parseText() {
    setParsing(true); setMsg(null);
    try {
      const res = await fetch("/api/watch/parse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: paste }) });
      const d = await res.json();
      if (!res.ok) { setMsg({ ok: false, text: d.error || "Could not read that." }); return; }
      if (!d.flights?.length) { setMsg({ ok: false, text: "No flights found in that text. Add them by hand below." }); return; }
      setRows(d.flights.map((f: { flightNumber: string; date: string; from?: string | null; passengers?: number }) => ({ flightNumber: f.flightNumber, date: f.date, departureIata: f.from || "", passengers: f.passengers || 1 })));
      setMsg({ ok: true, text: `Found ${d.flights.length} flight${d.flights.length === 1 ? "" : "s"}. Check the dates, then confirm.` });
    } finally { setParsing(false); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/watch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, token, flights: rows.filter((r) => r.flightNumber && r.date) }) });
      const d = await res.json();
      if (!res.ok) { setMsg({ ok: false, text: d.error || "Something went wrong." }); return; }
      if (d.status === "pending") setMsg({ ok: true, text: `Check your inbox: one click confirms the watch on ${d.count} flight${d.count === 1 ? "" : "s"}.` });
      else setMsg({ ok: true, text: `Watching ${d.count} flight${d.count === 1 ? "" : "s"}. We check each one the morning after it lands.` });
      setRows([blank()]); setPaste("");
      onDone?.();
      if (!token) window.location.href = `/watch/${d.token}?added=${d.count}`;
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="card" style={{ display: "grid", gap: 14, padding: compact ? 18 : 24 }} aria-label="Watch my flights">
      {!compact && (
        <div className="field">
          <label htmlFor="paste">Fastest: paste your booking confirmation email</label>
          <textarea id="paste" className="input" rows={4} placeholder="Paste the confirmation text here and we will pull out the flight numbers and dates" value={paste} onChange={(e) => setPaste(e.target.value)} />
          <button type="button" className="btn btn-ghost" onClick={parseText} disabled={parsing || paste.trim().length < 20} style={{ justifySelf: "start" }}>{parsing ? "Reading…" : "Find my flights in this text"}</button>
        </div>
      )}
      <div style={{ display: "grid", gap: 10 }}>
        <span className="small" style={{ fontWeight: 600, color: "var(--ink-2)" }}>{compact ? "Flights to watch" : "Or add flights by hand"}</span>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 0.8fr 0.6fr auto", gap: 8, alignItems: "end" }} className="watch-row">
            <div className="field"><label htmlFor={`fn${i}`}>Flight</label><input id={`fn${i}`} className="input mono" placeholder="U28160" value={r.flightNumber} onChange={(e) => set(i, { flightNumber: e.target.value })} required={i === 0} /></div>
            <div className="field"><label htmlFor={`dt${i}`}>Date</label><input id={`dt${i}`} className="input mono" type="date" min={minDate} max={maxDate} value={r.date} onChange={(e) => set(i, { date: e.target.value })} required={i === 0} /></div>
            <div className="field"><label htmlFor={`dp${i}`}>From (opt.)</label><input id={`dp${i}`} className="input mono" placeholder="LGW" maxLength={3} value={r.departureIata} onChange={(e) => set(i, { departureIata: e.target.value })} /></div>
            <div className="field"><label htmlFor={`px${i}`}>Pax</label><select id={`px${i}`} className="input" value={r.passengers} onChange={(e) => set(i, { passengers: Number(e.target.value) })}>{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
            <button type="button" className="btn btn-ghost" aria-label="Remove flight" onClick={() => setRows((x) => x.length > 1 ? x.filter((_, j) => j !== i) : [blank()])} style={{ padding: "12px 12px" }}>×</button>
          </div>
        ))}
        <button type="button" className="btn btn-ghost" onClick={() => setRows((x) => [...x, blank()])} style={{ justifySelf: "start", padding: "8px 14px", fontSize: 14 }}>+ Add another flight</button>
      </div>
      {!token && (
        <div className="field"><label htmlFor="email">Email for the results</label><input id="email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></div>
      )}
      {msg && <p role="status" className="small" style={{ color: msg.ok ? "var(--go)" : "var(--stop)", margin: 0 }}>{msg.text}</p>}
      <button className="btn btn-accent" type="submit" disabled={busy} style={{ justifySelf: "start", minWidth: 220 }}>{busy ? "Saving…" : token ? "Add to my watch list" : "Watch my flights, free"}</button>
      <p className="small muted" style={{ margin: 0 }}>Free. We check each flight once, the morning after it lands, and email you the verdict. Nothing to pay unless a flight qualifies and you want the letter. Unsubscribe in one click.</p>
      <style>{`@media (max-width: 720px){ .watch-row { grid-template-columns: 1fr 1fr !important; } }`}</style>
    </form>
  );
}
