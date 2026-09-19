"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WatchRow } from "./page";

function verdictPill(v: string | null) {
  if (v === "claim") return <span className="pill go">Claim</span>;
  if (v === "borderline") return <span className="pill warn">Claim, pushback likely</span>;
  if (v === "no_claim") return <span className="pill stop">Nothing owed</span>;
  if (v === "unclear") return <span className="pill warn">Needs a detail</span>;
  if (v === "no_record") return <span className="pill warn">No record found</span>;
  return <span className="pill dark">Checked</span>;
}

export default function WatchList({ token, upcoming, done }: { token: string; upcoming: WatchRow[]; done: WatchRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  async function remove(id?: string) {
    setBusy(id ?? "all");
    await fetch("/api/watch/unsubscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, id }) });
    setBusy(null);
    if (!id) window.location.href = "/watch?unsubscribed=1"; else router.refresh();
  }
  return (
    <>
      <section className="card" style={{ marginTop: 18 }}>
        <p className="eyebrow">Upcoming and awaiting check</p>
        {upcoming.length === 0 ? <p className="small muted" style={{ marginTop: 8 }}>No flights waiting. Add some below.</p> : (
          <table className="tbl" style={{ marginTop: 8 }}>
            <thead><tr><th>Flight</th><th>Date</th><th>Pax</th><th>Status</th><th></th></tr></thead>
            <tbody>{upcoming.map((r) => (
              <tr key={r.id}><td className="mono">{r.flight_number}{r.departure_iata ? ` (${r.departure_iata})` : ""}</td><td className="mono">{r.flight_date}</td><td className="mono">{r.passengers}</td><td className="small">{r.status === "pending" ? "Awaiting your confirmation" : "Watching; checked the morning after"}</td><td><button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 13 }} disabled={busy === r.id} onClick={() => remove(r.id)}>Remove</button></td></tr>
            ))}</tbody>
          </table>
        )}
      </section>
      {done.length > 0 && (
        <section className="card" style={{ marginTop: 16 }}>
          <p className="eyebrow">Checked</p>
          <table className="tbl" style={{ marginTop: 8 }}>
            <thead><tr><th>Flight</th><th>Date</th><th>Result</th><th></th></tr></thead>
            <tbody>{done.map((r) => (
              <tr key={r.id}><td className="mono">{r.flight_number}</td><td className="mono">{r.flight_date}</td><td>{verdictPill(r.verdict)}</td><td>{r.check_token ? <a href={`/check/${r.check_token}`}>View</a> : r.verdict === "no_record" ? <a href={`/?flight=${r.flight_number}&date=${r.flight_date}`}>Retry with departure airport</a> : ""}</td></tr>
            ))}</tbody>
          </table>
        </section>
      )}
      <p className="small muted" style={{ marginTop: 12 }}><button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 13 }} disabled={busy === "all"} onClick={() => remove()}>Stop watching everything and delete my watch list</button></p>
    </>
  );
}
