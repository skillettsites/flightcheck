"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Asked only after the record has spoken: the record knows the flight was cancelled, only the
// passenger knows when they were told and whether a re-route was offered.
export function CancellationRefine({ token }: { token: string }) {
  const router = useRouter();
  const [notice, setNotice] = useState("");
  const [reroute, setReroute] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (notice === "") { setError("Choose when the airline told you."); return; }
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/check/refine", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, noticeDays: Number(notice), reroutedWithinLimits: reroute === "" ? null : reroute === "yes" }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong."); setBusy(false); return; }
      router.push(`/check/${data.token}`);
    } catch { setError("Could not save that. Please try again."); setBusy(false); }
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
      <div className="field">
        <label>When did the airline tell you it was cancelled?</label>
        <div className="seg" role="group" aria-label="Notice given">
          {([["0", "On the day or after"], ["3", "1 to 6 days before"], ["10", "7 to 13 days before"], ["14", "14+ days before"]] as [string, string][]).map(([v, l]) => (
            <button key={v} type="button" aria-pressed={notice === v} onClick={() => setNotice(v)}>{l}</button>
          ))}
        </div>
      </div>
      {(notice === "3" || notice === "10" || notice === "0") && (
        <div className="field">
          <label>Were you offered another flight close to the original times?</label>
          <div className="seg" role="group" aria-label="Re-routing offered">
            {([["", "Not sure / none"], ["yes", "Yes, within a couple of hours"], ["no", "No, much later or not at all"]] as [string, string][]).map(([v, l]) => (
              <button key={v || "none"} type="button" aria-pressed={reroute === v} onClick={() => setReroute(v)}>{l}</button>
            ))}
          </div>
        </div>
      )}
      {error && <p role="alert" className="small" style={{ color: "var(--stop)", margin: 0 }}>{error}</p>}
      <button className="btn btn-accent" type="submit" disabled={busy} style={{ justifySelf: "start", minWidth: 200 }}>{busy ? "Updating…" : "Give me the verdict"}</button>
    </form>
  );
}

// A flight that ran on time can still owe compensation if the passenger was bumped. One click.
export function DeniedBoardingLink({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    try {
      const res = await fetch("/api/check/refine", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, deniedBoarding: true }) });
      const data = await res.json();
      if (res.ok) { router.push(`/check/${data.token}`); return; }
    } catch { /* fall through */ }
    setBusy(false);
  }
  return (
    <button type="button" onClick={go} disabled={busy} className="small" style={{ background: "none", border: 0, padding: 0, color: "var(--ink)", textDecoration: "underline", textUnderlineOffset: 3, cursor: "pointer", font: "inherit", fontSize: 14 }}>
      {busy ? "Updating…" : "I was denied boarding on this flight (overbooked)"}
    </button>
  );
}
