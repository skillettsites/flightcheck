import type { Metadata } from "next";
import Link from "next/link";
import { PRODUCTS } from "@/lib/products";

export const metadata: Metadata = {
  title: "Pricing: free check, £4.99 letter, £9.99 pack",
  description: "The verdict is free. A ready-to-send claim letter is £4.99. The full pack with the follow-up letter and evidence appendix is £9.99. No percentage fees, ever.",
};

export default function Pricing() {
  return (
    <div className="wrap" style={{ paddingTop: 40, maxWidth: 900 }}>
      <p className="eyebrow">Pricing</p>
      <h1 style={{ fontSize: "clamp(30px,4.5vw,44px)", marginTop: 8 }}>One price, once, whatever you win</h1>
      <p className="muted measure" style={{ fontSize: 18 }}>Claims firms charge 35% to 50% of your compensation. On a family of four owed £350 each, that is £490 to £700 gone. We charge for the document and nothing else.</p>

      <div className="grid-3" style={{ marginTop: 24 }}>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}><h3>The check</h3><span className="mono" style={{ fontSize: 22 }}>Free</span></div>
          <ul className="small muted" style={{ paddingLeft: 18, display: "grid", gap: 4, marginTop: 8 }}>
            <li>Flight record: scheduled vs actual</li>
            <li>Regulation, band and amount per passenger</li>
            <li>Eurocontrol delay causes and weather that day</li>
            <li>Defence-risk grade and the right ADR scheme</li>
            <li>No account, no card, no airline contacted</li>
          </ul>
        </div>
        {Object.values(PRODUCTS).map((p) => (
          <div className="card" key={p.id} style={p.id === "pack" ? { borderColor: "var(--accent)" } : undefined}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}><h3>{p.name}</h3><span className="mono" style={{ fontSize: 22 }}>{p.priceLabel}</span></div>
            <ul className="small muted" style={{ paddingLeft: 18, display: "grid", gap: 4, marginTop: 8 }}>{p.includes.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        ))}
      </div>

      <table className="tbl" style={{ marginTop: 32, maxWidth: 720 }}>
        <thead><tr><th>Claim value</th><th>Claims firm keeps (35 to 50%)</th><th>FlightDelayCheck</th></tr></thead>
        <tbody>
          <tr><td>1 passenger, £220</td><td className="mono">£77 to £110</td><td className="mono">£4.99</td></tr>
          <tr><td>2 passengers, £350 each</td><td className="mono">£245 to £350</td><td className="mono">£4.99</td></tr>
          <tr><td>4 passengers, £520 each</td><td className="mono">£728 to £1,040</td><td className="mono">£9.99 (pack)</td></tr>
        </tbody>
      </table>
      <p className="small muted" style={{ marginTop: 10 }}>Fee ranges are the published rates of the largest UK claims firms in September 2026 (42% plus VAT; 35% plus 15% for legal action; 44% rising to 50%).</p>

      <div className="honest" style={{ marginTop: 26, maxWidth: 720 }}>
        <p style={{ margin: 0, fontWeight: 600 }}>And the £0 option is real.</p>
        <p className="small" style={{ margin: "6px 0 0" }}>Use the airline&apos;s own form and a free template from the CAA, Which? or MoneySavingExpert. You will not have the flight record, the delay causes or the weather in the letter, and you will write the extraordinary-circumstances paragraph yourself, but the claim is the same claim. <Link href="/">Run the free check</Link> either way.</p>
      </div>

      <p className="small muted" style={{ marginTop: 22 }}>Prices include VAT where applicable. Payment by card through Stripe. Documents are produced immediately after payment with your consent, which ends the 14-day cancellation right; see <Link href="/refunds">refunds</Link>.</p>
    </div>
  );
}
