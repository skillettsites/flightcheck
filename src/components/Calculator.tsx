"use client";

import { useMemo, useState } from "react";
import { greatCircleKm, searchAirports, type Airport } from "@/lib/airports";
import { bandFor, coverage } from "@/lib/eu261";
import { isEuRegime } from "@/lib/regions";
import Link from "next/link";

function AirportPicker({ label, value, onChange, id }: { label: string; value: Airport | null; onChange: (a: Airport | null) => void; id: string }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const results = useMemo(() => searchAirports(q, 7), [q]);
  return (
    <div className="field" style={{ position: "relative" }}>
      <label htmlFor={id}>{label}</label>
      <input id={id} className="input" placeholder="Airport, city or code (e.g. Gatwick, LGW)" value={value ? `${value.city} (${value.iata})` : q}
        onChange={(e) => { onChange(null); setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} autoComplete="off" />
      {open && !value && results.length > 0 && (
        <ul role="listbox" style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, margin: 0, padding: 4, listStyle: "none", background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 6, boxShadow: "0 8px 24px rgba(14,27,46,.12)" }}>
          {results.map((a) => (
            <li key={a.iata}><button type="button" onMouseDown={() => { onChange(a); setQ(""); setOpen(false); }} style={{ width: "100%", textAlign: "left", font: "inherit", padding: "8px 10px", border: 0, background: "transparent", cursor: "pointer", borderRadius: 4 }}>
              <span className="mono" style={{ marginRight: 8 }}>{a.iata}</span>{a.city} <span className="muted small">{a.name}, {a.country}</span>
            </button></li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Calculator() {
  const [from, setFrom] = useState<Airport | null>(null);
  const [to, setTo] = useState<Airport | null>(null);
  const [carrier, setCarrier] = useState<"uk" | "eu" | "other">("uk");
  const [pax, setPax] = useState(1);
  const [delay, setDelay] = useState<"3plus" | "3to4" | "under3">("3plus");

  const km = from && to ? Math.round(greatCircleKm(from, to)) : null;
  const carrierCountry = carrier === "uk" ? "GB" : carrier === "eu" ? "IE" : "US";
  const regimes = from && to ? coverage({ depCountry: from.country, arrCountry: to.country, carrierCountry }) : [];
  const intraEu = !!from && !!to && isEuRegime(from.country) && isEuRegime(to.country);
  const bands = km !== null ? regimes.map((r) => bandFor(r.regime, km, intraEu)) : [];

  return (
    <div className="card" style={{ display: "grid", gap: 14 }}>
      <div className="grid-2" style={{ gap: 14 }}>
        <AirportPicker id="from" label="From" value={from} onChange={setFrom} />
        <AirportPicker id="to" label="To (final destination)" value={to} onChange={setTo} />
      </div>
      <div className="grid-3" style={{ gap: 14 }}>
        <div className="field"><label htmlFor="carrier">Airline is based in</label>
          <select id="carrier" className="input" value={carrier} onChange={(e) => setCarrier(e.target.value as typeof carrier)}>
            <option value="uk">the UK (BA, easyJet, Jet2, TUI, Virgin, Loganair)</option>
            <option value="eu">the EU, Norway, Iceland or Switzerland (Ryanair, Aer Lingus, KLM, Lufthansa, Wizz)</option>
            <option value="other">somewhere else (Emirates, Qatar, Delta, Turkish, Air Canada)</option>
          </select></div>
        <div className="field"><label htmlFor="delay">Arrival delay</label>
          <select id="delay" className="input" value={delay} onChange={(e) => setDelay(e.target.value as typeof delay)}>
            <option value="3plus">4 hours or more (or cancelled)</option>
            <option value="3to4">Between 3 and 4 hours</option>
            <option value="under3">Under 3 hours</option>
          </select></div>
        <div className="field"><label htmlFor="pax">Passengers</label>
          <select id="pax" className="input" value={pax} onChange={(e) => setPax(Number(e.target.value))}>{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
      </div>

      {from && to && (
        <div className="board" aria-live="polite">
          <div className="board-row"><span className="board-key">Route</span><span className="board-val dim">{from.iata} → {to.iata} · {km?.toLocaleString()} km</span></div>
          <div className="board-row"><span className="board-key">Covered by</span><span className="board-val dim">{regimes.length ? regimes.map((r) => r.regime).join(" + ") : "neither UK261 nor EU261"}</span></div>
          {delay === "under3" ? (
            <div className="board-row"><span className="board-key">Compensation</span><span className="board-val">£0 (care only)</span></div>
          ) : bands.map((b) => {
            const half = delay === "3to4" && b.reducedAmount ? b.reducedAmount : b.amount;
            const sym = b.currency === "GBP" ? "£" : "€";
            return <div className="board-row" key={b.regime}><span className="board-key">{b.regime} · {b.bandLabel}</span><span className="board-val">{sym}{half} × {pax} = {sym}{(half * pax).toLocaleString()}</span></div>;
          })}
          <p className="small muted" style={{ margin: "12px 0 0" }}>
            {regimes.length === 0 ? "Only flights departing the UK or EU, or arriving there on a UK/EU airline, are covered. Other countries have their own rules." : regimes.map((r) => r.basis).join("; ") + "."}
            {delay !== "under3" && regimes.length > 0 ? " Payable unless the airline proves extraordinary circumstances." : ""}
          </p>
        </div>
      )}
      <p className="small muted" style={{ margin: 0 }}>This is the amount by distance. To find out whether your actual flight qualifies, and what the airline can argue, <Link href="/">run the free check on the flight number</Link>.</p>
    </div>
  );
}
