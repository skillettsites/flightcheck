"use client";

import { useState } from "react";
import { PRODUCTS, type ProductId } from "@/lib/products";

export default function BuyBox({ checkToken, perPassenger, currency, defaultProduct = "letter", initialEmail = "", initialPassengers = 1 }: { checkToken: string; perPassenger: number | null; currency: "GBP" | "EUR" | null; defaultProduct?: ProductId; initialEmail?: string; initialPassengers?: number }) {
  const [product, setProduct] = useState<ProductId>(initialPassengers > 1 && defaultProduct === "letter" ? "pack" : defaultProduct);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [bookingRef, setBookingRef] = useState("");
  const [passengers, setPassengers] = useState(Math.min(9, Math.max(1, initialPassengers)));
  const [passengerNames, setPassengerNames] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sym = currency === "EUR" ? "€" : "£";
  const claim = perPassenger ? perPassenger * passengers : null;

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
    <form onSubmit={go} className="pass" id="buy">
      <div className="pass-main">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <span className="pass-code">Claim documents · written from this record</span>
          <span className="pass-code">Ref {checkToken}</span>
        </div>
        <div>
          <h2 style={{ fontSize: "clamp(24px, 3.2vw, 34px)" }}>{claim ? `Claim ${sym}${claim}${passengers > 1 ? ` for ${passengers} passengers` : ""}` : "Get your claim documents"}</h2>
          <p className="small muted" style={{ margin: "8px 0 0", maxWidth: "62ch" }}>The {PRODUCTS[product].name.toLowerCase()} is {PRODUCTS[product].priceLabel}, once. Compensation goes from the airline to you.</p>
        </div>

        <div className="ledger" role="radiogroup" aria-label="Choose a product">
          {(Object.values(PRODUCTS)).map((p) => (
            <label key={p.id} className="ledger-row" style={{ cursor: "pointer", gridTemplateColumns: "auto 1fr auto", padding: "12px 0", background: product === p.id ? "transparent" : undefined }}>
              <input type="radio" name="product" value={p.id} checked={product === p.id} onChange={() => setProduct(p.id)} style={{ accentColor: "var(--accent)", marginTop: 3 }} />
              <span>
                <strong style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>{p.name}</strong>
                {p.id === "pack" && <span className="pill dark" style={{ marginLeft: 8, verticalAlign: "middle" }}>Recommended for 2+</span>}
                <br /><span className="small muted">{p.description}</span>
              </span>
              <span className="ledger-val" style={{ fontSize: 17 }}>{p.priceLabel}</span>
            </label>
          ))}
        </div>

        <div className="grid-2" style={{ gap: 12 }}>
          <div className="field"><label htmlFor="name">Full name, as on the booking</label><input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" /></div>
          <div className="field"><label htmlFor="email">Email for the documents</label><input id="email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></div>
        </div>
        <div className="field"><label htmlFor="address">Postal address, printed at the top of the letter</label><textarea id="address" className="input" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} required autoComplete="street-address" /></div>
        <div className="grid-2" style={{ gap: 12 }}>
          <div className="field"><label htmlFor="ref">Booking reference (optional)</label><input id="ref" className="input mono" value={bookingRef} onChange={(e) => setBookingRef(e.target.value)} maxLength={12} /></div>
          <div className="field"><label htmlFor="pax">Passengers on the booking</label>
            <select id="pax" className="input" value={passengers} onChange={(e) => setPassengers(Number(e.target.value))}>{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
        </div>
        {passengers > 1 && <div className="field"><label htmlFor="paxnames">Other passengers&apos; names (optional, they go in the letter)</label><input id="paxnames" className="input" value={passengerNames} onChange={(e) => setPassengerNames(e.target.value)} /></div>}

        <label className="small" style={{ display: "flex", gap: 10, alignItems: "flex-start", color: "var(--ink-2)" }}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required style={{ marginTop: 3, accentColor: "var(--accent)" }} />
          <span>I want my documents produced immediately after payment. I understand this means I lose the 14-day right to cancel under the Consumer Contracts Regulations 2013 once they are delivered, and I have read the <a href="/refunds" target="_blank" rel="noopener">refund policy</a>.</span>
        </label>
        {error && <p role="alert" className="small" style={{ color: "var(--stop)", margin: 0 }}>{error}</p>}
        <p className="small muted" style={{ margin: 0 }}>Card payment by Stripe. We are not a law firm or a claims company and we never contact the airline for you.</p>
      </div>

      <div className="pass-stub">
        <div>
          <p className="pass-code" style={{ margin: "0 0 6px" }}>{PRODUCTS[product].name}</p>
          <p className="pass-big" style={{ margin: 0 }}>{PRODUCTS[product].priceLabel}</p>
          <p className="small muted" style={{ margin: "8px 0 0", lineHeight: 1.4 }}>Once. Nothing else to pay, ever.</p>
          {claim && (
            <dl className="kv" style={{ marginTop: 16, gridTemplateColumns: "1fr", gap: 2 }}>
              <dt>Your claim</dt><dd style={{ fontSize: 18 }}>{sym}{claim}</dd>
              <dt style={{ marginTop: 8 }}>You keep</dt><dd style={{ fontSize: 18, color: "var(--go)" }}>{sym}{claim}</dd>
            </dl>
          )}
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <button className="btn btn-accent" type="submit" disabled={busy} style={{ width: "100%" }}>{busy ? "Opening checkout…" : `Pay ${PRODUCTS[product].priceLabel}`}</button>
          <p className="pass-code" style={{ margin: 0, textAlign: "center" }}>Delivered on payment</p>
        </div>
      </div>
    </form>
  );
}
