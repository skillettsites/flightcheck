import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sbRpc } from "@/lib/supabase";
import type { CheckResult } from "@/lib/check";
import VerdictBoard from "@/components/VerdictBoard";
import EvidencePanel from "@/components/EvidencePanel";
import BuyBox from "@/components/BuyBox";
import { CancellationRefine, DeniedBoardingLink } from "@/components/RefineForm";

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
      {sp.cancelled && <p className="small" style={{ borderLeft: "3px solid var(--warn)", color: "var(--warn)", padding: "6px 12px" }}>Checkout was cancelled. Nothing has been charged; your check is still here.</p>}
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
          {!r.flight.cancelled && r.regimes.length > 0 && r.input.disruption !== "denied_boarding" && (
            <p className="small muted" style={{ margin: "12px 0 0" }}>Bumped from this flight because it was overbooked? That is compensated even when the flight ran on time. <DeniedBoardingLink token={token} /></p>
          )}
        </section>
      )}

      {r.verdict === "unclear" && r.flight.cancelled && (
        <section className="pass" style={{ marginTop: 22 }}>
          <div className="pass-main">
            <span className="pass-code">One thing the record cannot tell us</span>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 30px)" }}>The flight was cancelled. When were you told?</h2>
            <p className="small muted" style={{ margin: 0, maxWidth: "62ch" }}>Compensation for a cancellation turns on notice: 14 days or more and none is due; less than that and it is, unless the airline re-routed you close to the original times. Everything else is already on the board.</p>
            <CancellationRefine token={token} />
          </div>
          <div className="pass-stub">
            <div>
              <p className="pass-code" style={{ margin: "0 0 6px" }}>If it qualifies</p>
              <p className="pass-big" style={{ margin: 0 }}>{band ? `${band.currency === "GBP" ? "£" : "€"}${band.amount}` : "Per seat"}</p>
              <p className="small muted" style={{ margin: "8px 0 0", lineHeight: 1.4 }}>per passenger, whatever the fare was.</p>
            </div>
            <p className="pass-code" style={{ margin: 0 }}>No card, no account</p>
          </div>
        </section>
      )}

      {r.verdict === "unclear" && !r.flight.cancelled && (
        <section className="notice" style={{ marginTop: 22 }}>
          <span className="eyebrow">Record gap</span>
          <div>
            <p style={{ margin: 0, fontWeight: 600 }}>The record has no arrival time for this flight.</p>
            <p className="small muted" style={{ margin: "6px 0 0" }}>{r.eligibility.reason} If the flight number flew more than one leg that day, <Link href="/">run it again</Link> with the departure airport code. Otherwise <Link href="/contact">send us the details</Link> and we will check it by hand.</p>
          </div>
        </section>
      )}

      <EvidencePanel r={r} />

      <section className="notice" style={{ marginTop: 32, maxWidth: "none", gridTemplateColumns: "auto 1fr auto", alignItems: "center" }}>
        <span className="eyebrow">Flight Watch</span>
        <div><p style={{ margin: 0, fontWeight: 600 }}>Never check by hand again.</p><p className="small muted" style={{ margin: "4px 0 0" }}>Add your upcoming flights and we read each record the morning after it lands. Verdict by email, free; letter only if you want it.</p></div>
        <Link href="/watch" className="btn btn-ghost">Watch my flights</Link>
      </section>

      <section style={{ marginTop: 32 }} className="strip2">
        <div>
          <p className="eyebrow" style={{ color: "var(--accent)" }}>If the airline says no</p>
          <h3 style={{ marginTop: 8 }}>{r.adr.scheme === "CAA PACT" ? "CAA complaints team" : r.adr.scheme}</h3>
          <p className="small muted">{r.adr.note}</p>
          <a className="btn btn-ghost" href={r.adr.url} target="_blank" rel="noopener">Open the scheme&apos;s site</a>
        </div>
        <div>
          <p className="eyebrow" style={{ color: "var(--accent)" }}>Time limit</p>
          <h3 style={{ marginTop: 8 }}>Claim by <span className="mono" style={{ fontWeight: 500 }}>{r.limitation.deadline ?? "the limitation date"}</span></h3>
          <p className="small muted">{r.limitation.years} years from the flight in {r.limitation.where}. There is no deadline for the first letter beyond that, but airlines answer faster while the operational records are fresh.</p>
          {r.airlineClaimUrl && <a className="btn btn-ghost" href={r.airlineClaimUrl} target="_blank" rel="noopener">{r.flight.airline.name}&apos;s own claim page</a>}
        </div>
      </section>
      <style>{`
        .strip2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .strip2 > div { padding: 20px; background: var(--paper-2); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); }
        .strip2 > div + div { }
        @media (max-width: 760px) { .strip2 { grid-template-columns: 1fr; } .notice[style] { grid-template-columns: 1fr !important; } }
      `}</style>

      <p className="small muted" style={{ marginTop: 26, maxWidth: "76ch" }}>
        This check is information, not legal advice, and the verdict is our reading of the public record. You can make this claim yourself for free using the airline&apos;s form and the free templates from the CAA, Which? or MoneySavingExpert. Nothing here requires you to buy anything. Check reference <span className="mono">{token}</span>.
      </p>
    </div>
  );
}
