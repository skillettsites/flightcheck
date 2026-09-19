import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { sbRpc } from "@/lib/supabase";
import type { PurchaseRow } from "@/lib/fulfil";
import type { CheckResult } from "@/lib/check";
import ReportClient from "./ReportClient";
import EvidencePanel from "@/components/EvidencePanel";
import { PRODUCTS } from "@/lib/products";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your claim documents", robots: { index: false } };

export default async function ReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const rows = await sbRpc<PurchaseRow>("fcc_get_purchase", { p_token: token });
  const p = rows[0];
  if (!p) notFound();
  const checks = await sbRpc<{ token: string; result: CheckResult }>("fcc_get_check", { p_token: p.check_token });
  const r = checks[0]?.result ?? null;
  const product = PRODUCTS[p.product];

  if (p.status !== "ready" || !p.letter_text) {
    return (
      <div className="wrap" style={{ paddingTop: 40, maxWidth: 760 }}>
        <ReportClient token={token} />
      </div>
    );
  }

  return (
    <div className="wrap" style={{ paddingTop: 28, paddingBottom: 40, maxWidth: 900 }}>
      <p className="eyebrow">{product.name} · {r?.flight.number} · {r?.input.date}</p>
      <h1 style={{ fontSize: "clamp(28px,4vw,40px)", marginTop: 6 }}>Your claim letter is ready</h1>
      <p className="muted measure">Copy it into the airline&apos;s claim form or email it to their customer relations address. Keep this page; the link is in your email too{p.email_sent ? "" : " (email delivery is not set up yet, so bookmark this page)"}.</p>

      <div className="no-print" style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "14px 0 18px" }}>
        <ReportClient token={token} letter={p.letter_text} mode="tools" />
        {r?.airlineClaimUrl && <a className="btn btn-ghost" href={r.airlineClaimUrl} target="_blank" rel="noopener">Open {r.flight.airline.name}&apos;s claim page</a>}
      </div>

      <article className="letter" aria-label="Claim letter">{p.letter_text}</article>

      <section className="card no-print" style={{ marginTop: 22 }}>
        <h3>How to send it</h3>
        <ol className="small muted" style={{ paddingLeft: 18, display: "grid", gap: 6 }}>
          <li>Most airlines want claims through their online form. Paste the letter into the free-text box and attach your boarding pass or booking confirmation.</li>
          <li>If there is a postal or email route, send it there too and keep a copy with the date.</li>
          <li>They have 28 days to respond in substance. Diary it.</li>
          <li>If they refuse citing extraordinary circumstances, or you hear nothing in 8 weeks, use the escalation route below. It is free to you.</li>
        </ol>
      </section>

      {p.product === "pack" && p.escalation_text && (
        <section style={{ marginTop: 28 }}>
          <p className="eyebrow">Claim Pack · follow-up letter</p>
          <h2 style={{ margin: "6px 0 10px" }}>If they say no, or say nothing</h2>
          <p className="muted measure">Send this after a refusal on extraordinary-circumstances grounds, or after 8 weeks of silence. Change the date and the reference to their reply if you have one.</p>
          <article className="letter" aria-label="Follow-up letter">{p.escalation_text}</article>
        </section>
      )}

      {r && (
        <section style={{ marginTop: 28 }}>
          <p className="eyebrow">Escalation route</p>
          <div className="grid-2" style={{ marginTop: 8 }}>
            <div className="card">
              <h3>{r.adr.scheme === "CAA PACT" ? "CAA Passenger Advice and Complaints Team" : r.adr.scheme}</h3>
              <p className="small muted">{r.adr.note}</p>
              <p className="small muted">You will need: the airline&apos;s final response (or proof you wrote 8 weeks ago), your booking reference, this letter, and the evidence appendix below.</p>
              <a className="btn btn-ghost" href={r.adr.url} target="_blank" rel="noopener">Go to {r.adr.scheme === "CAA PACT" ? "the CAA" : r.adr.scheme}</a>
            </div>
            <div className="card">
              <h3>Deadlines</h3>
              <dl className="kv">
                <dt>Airline response</dt><dd>28 days from sending</dd>
                <dt>ADR available</dt><dd>after final response, or 8 weeks of silence</dd>
                <dt>Limitation</dt><dd>{r.limitation.deadline ?? "see your rights"}</dd>
                <dt>Keep</dt><dd>boarding pass, booking, receipts, every reply</dd>
              </dl>
            </div>
          </div>
        </section>
      )}

      {r && p.product === "pack" && (
        <div style={{ marginTop: 8 }}>
          <EvidencePanel r={r} />
        </div>
      )}

      <p className="small muted no-print" style={{ marginTop: 26 }}>Order {p.token}. Written from the verified flight record for {r?.flight.number} on {r?.input.date}. If any fact in the letter is wrong, reply to your confirmation email and we will correct it or refund you.</p>
    </div>
  );
}
