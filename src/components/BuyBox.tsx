"use client";

import { useState } from "react";
import { PRODUCTS, type ProductId } from "@/lib/products";

export default function BuyBox({ checkToken, perPassenger, currency, defaultProduct = "letter" }: { checkToken: string; perPassenger: number | null; currency: "GBP" | "EUR" | null; defaultProduct?: ProductId }) {
  const [product, setProduct] = useState<ProductId>(defaultProduct);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [bookingRef, setBookingRef] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [passengerNames, setPassengerNames] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sym = currency === "EUR" ? "€" : "£";

  async function go(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ checkToken, product, name, address, email, bookingRef, passengers, passengerNames, consent }) });
      const data = await res.json();
      if (!res.ok || !data.url) { setError(data.error || "Could not start checkout."); setBusy(false); return; }
      window.location.href = data.url;
    } catch {
      setError("Could not start checkout. Please try again."); setBusy(false);
    }
  }

  return (
    <form onSubmit={go} className="card" id="buy" style={{ display: "grid", gap: 14, borderColor: "var(--accent)" }}>
      <div>
        <p className="eyebrow">Get the letter written from this record</p>
        <h2 style={{ marginTop: 6 }}>{perPassenger ? `Claim ${sym}${perPassenger * passengers}${passengers > 1 ? ` for ${passengers} passengers` : ""}` : "Get your claim documents"}</h2>
        <p className="small muted" style={{ marginBottom: 0 }}>A claims firm would keep {perPassenger ? `${sym}${Math.round(perPassenger * passengers * 0.35)} to ${sym}${Math.round(perPassenger * passengers * 0.5)}` : "35% to 50%"} of that. The letter is {PRODUCTS[product].priceLabel}, once, and you keep the lot.</p>
      </div>

      <div className="grid-2" style={{ gap: 10 }}>
        {(Object.values(PRODUCTS)).map((p) => (
          <label key={p.id} className="card" style={{ padding: 14, cursor: "pointer", borderColor: product === p.id ? "var(--ink)" : "var(--line)", display: "grid", gap: 4 }}>
            <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontFamily: "var(--font-display)" }}>
                <input type="radio" name="product" value={p.id} checked={product === p.id} onChange={() => setProduct(p.id)} /> {p.name}
              </span>
              <span className="mono" style={{ fontSize: 18 }}>{p.priceLabel}</span>
            </span>
            <span className="small muted">{p.description}</span>
          </label>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 12 }}>
        <div className="field"><label htmlFor="name">Your full name (as on the booking)</label><input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" /></div>
        <div className="field"><label htmlFor="email">Email for your documents</label><input id="email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></div>
      </div>
      <div className="field"><label htmlFor="address">Postal address (goes at the top of the letter)</label><textarea id="address" className="input" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} required autoComplete="street-address" /></div>
      <div className="grid-2" style={{ gap: 12 }}>
        <div className="field"><label htmlFor="ref">Booking reference (optional)</label><input id="ref" className="input mono" value={bookingRef} onChange={(e) => setBookingRef(e.target.value)} maxLength={12} /></div>
        <div className="field"><label htmlFor="pax">Passengers on the booking</label>
          <select id="pax" className="input" value={passengers} onChange={(e) => setPassengers(Number(e.target.value))}>{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
      </div>
      {passengers > 1 && <div className="field"><label htmlFor="paxnames">Other passengers&apos; names (optional, they go in the letter)</label><input id="paxnames" className="input" value={passengerNames} onChange={(e) => setPassengerNames(e.target.value)} /></div>}

      <label className="small" style={{ display: "flex", gap: 10, alignItems: "flex-start", color: "var(--ink-2)" }}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required style={{ marginTop: 3 }} />
        <span>I want my documents produced immediately after payment. I understand this means I lose the 14-day right to cancel under the Consumer Contracts Regulations 2013 once they are delivered, and I have read the <a href="/refunds" target="_blank" rel="noopener">refund policy</a>.</span>
      </label>
      {error && <p role="alert" className="small" style={{ color: "var(--stop)", margin: 0 }}>{error}</p>}
      <button className="btn btn-primary" type="submit" disabled={busy} style={{ justifySelf: "start", minWidth: 240 }}>{busy ? "Opening secure checkout…" : `Pay ${PRODUCTS[product].priceLabel} and get my ${PRODUCTS[product].name}`}</button>
      <p className="small muted" style={{ margin: 0 }}>Total price {PRODUCTS[product].priceLabel}, nothing else to pay, ever. Card payment by Stripe. We are not a law firm or a claims company and we never contact the airline for you.</p>
    </form>
  );
}
