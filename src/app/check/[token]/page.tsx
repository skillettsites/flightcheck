import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sbRpc } from "@/lib/supabase";
import type { CheckResult } from "@/lib/check";
import VerdictBoard from "@/components/VerdictBoard";
import EvidencePanel from "@/components/EvidencePanel";
import BuyBox from "@/components/BuyBox";
import CheckForm from "@/components/CheckForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Your flight check", robots: { index: false } };

async function load(token: string): Promise<CheckResult | null> {
  const rows = await sbRpc<{ token: string; result: CheckResult }>("fcc_get_check", { p_token: token });
  return rows[0]?.result ?? null;
}

export default async function CheckPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ cancelled?: string; email?: string; pax?: string }> }) {
  const { token } = await params;
  const sp = await searchParams;
  const r = await load(token);
  if (!r) notFound();
  const band = r.bands[0] ?? null;
  const canBuy = r.verdict === "claim" || r.verdict === "borderline";

  return (
    <div className="wrap" style={{ paddingTop: 28, paddingBottom: 40 }}>
      {sp.cancelled && <p className="small" style={{ background: "var(--warn-soft)", color: "var(--warn)", padding: "10px 14px", borderRadius: 6 }}>Checkout was cancelled. Nothing has been charged; your check is still here.</p>}
      <VerdictBoard r={r} />

      {canBuy && (
        <div style={{ marginTop: 22 }}>
          <BuyBox checkToken={token} perPassenger={band?.amount ?? null} currency={band?.currency ?? null} defaultProduct={r.verdict === "borderline" ? "pack" : "letter"} initialEmail={sp.email ?? ""} initialPassengers={Number(sp.pax) || r.input.passengers || 1} />
        </div>
      )}

      {r.verdict === "no_claim" && (
        <section className="card" style={{ marginTop: 22 }}>
          <h3>What you can still do</h3>
          <ul className="small muted" style={{ paddingLeft: 18, display: "grid", gap: 6 }}>
            {r.flight.arrivalDelayMin !== null && r.flight.arrivalDelayMin >= 120 && <li>You were entitled to care (meals, refreshments, two phone calls or emails) once the delay passed two hours on a short-haul flight, three on medium-haul, four on long-haul. Keep receipts and claim them back from the airline.</li>}
            {r.regimes.length === 0 && <li>Neither UK261 nor EU261 covers this route and carrier. Check the rules of the departure country: Canada&apos;s APPR pays up to CAD 1,000 for airline-caused delays; the US requires refunds for cancellations but has no fixed compensation.</li>}
            <li>If you think the record is wrong (for example you were on a different leg of this flight number), <Link href="/">run the check again</Link> with the departure airport code filled in.</li>
            <li>Travel insurance may cover consequential costs. That is a separate claim to your insurer and outside what we do.</li>
          </ul>
        </section>
      )}

      {r.verdict === "unclear" && (
        <section className="card" style={{ marginTop: 22 }}>
          <h3>One detail decides it</h3>
          <p className="small muted">{r.eligibility.reason} Run the check again with the cancellation notice filled in and the verdict will be definite.</p>
          <div style={{ marginTop: 12 }}><CheckForm compact /></div>
        </section>
      )}

      <EvidencePanel r={r} />

      <section className="card" style={{ marginTop: 28, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div><p className="eyebrow">Flight Watch · free</p><h3 style={{ marginTop: 4 }}>Never check by hand again</h3><p className="small muted" style={{ margin: 0 }}>Add your upcoming flights and we check each one the morning after it lands. Verdict by email; letter only if you want it.</p></div>
        <Link href="/watch" className="btn btn-primary">Watch my flights</Link>
      </section>

      <section style={{ marginTop: 28 }} className="grid-2">
        <div className="card">
          <p className="eyebrow">If the airline says no</p>
          <h3 style={{ marginTop: 6 }}>{r.adr.scheme === "CAA PACT" ? "CAA complaints team" : r.adr.scheme}</h3>
          <p className="small muted">{r.adr.note}</p>
          <a className="btn btn-ghost" href={r.adr.url} target="_blank" rel="noopener">Open the scheme&apos;s site</a>
        </div>
        <div className="card">
          <p className="eyebrow">Time limit</p>
          <h3 style={{ marginTop: 6 }}>Claim by {r.limitation.deadline ?? "the limitation date"}</h3>
          <p className="small muted">{r.limitation.years} years from the flight in {r.limitation.where}. There is no deadline for the first letter beyond that, but airlines answer faster while the operational records are fresh.</p>
          {r.airlineClaimUrl && <a className="btn btn-ghost" href={r.airlineClaimUrl} target="_blank" rel="noopener">{r.flight.airline.name}&apos;s own claim page</a>}
        </div>
      </section>

      <p className="small muted" style={{ marginTop: 26, maxWidth: "76ch" }}>
        This check is information, not legal advice, and the verdict is our reading of the public record. You can make this claim yourself for free using the airline&apos;s form and the free templates from the CAA, Which? or MoneySavingExpert. Nothing here requires you to buy anything. Check reference <span className="mono">{token}</span>.
      </p>
    </div>
  );
}
