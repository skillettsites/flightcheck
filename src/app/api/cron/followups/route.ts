import { NextRequest, NextResponse } from "next/server";
import { sbRpc } from "@/lib/supabase";
import type { PurchaseRow } from "@/lib/fulfil";
import type { CheckResult } from "@/lib/check";
import { followupEmail, sendEmail } from "@/lib/emails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Daily. Stage 1 at 28 days, stage 2 at 56, stage 3 at 84. Stops as soon as the customer reports an outcome.
const STAGES: { stage: 1 | 2 | 3; days: number }[] = [{ stage: 1, days: 28 }, { stage: 2, days: 56 }, { stage: 3, days: 84 }];

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const summary: Record<string, number> = {};
  for (const { stage, days } of STAGES) {
    const due = await sbRpc<PurchaseRow>("fcc_due_followups", { p_key: secret, p_stage: stage, p_min_days: days, p_limit: 40 });
    for (const p of due) {
      if (!p.customer_email) { await sbRpc("fcc_mark_followup", { p_key: secret, p_id: p.id, p_stage: stage }); continue; }
      const checks = await sbRpc<{ result: CheckResult }>("fcc_get_check", { p_token: p.check_token });
      const r = checks[0]?.result;
      const m = followupEmail(stage, {
        token: p.token, name: p.customer_name || "", flightNumber: r?.flight.number || p.check_token, date: r?.input.date || "", airline: r?.flight.airline.name || "the airline",
        adrScheme: r?.adr.scheme === "CAA PACT" ? "the CAA" : r?.adr.scheme || "AviationADR", adrUrl: r?.adr.url || "https://www.aviationadr.org.uk/", product: p.product,
      });
      const mail = await sendEmail(p.customer_email, m.subject, m.html, m.text);
      if (mail.sent) await sbRpc("fcc_mark_followup", { p_key: secret, p_id: p.id, p_stage: stage });
      summary[`stage${stage}`] = (summary[`stage${stage}`] ?? 0) + (mail.sent ? 1 : 0);
    }
  }
  return NextResponse.json({ sent: summary });
}
