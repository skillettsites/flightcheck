import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { runCheck } from "@/lib/check";
import { sbInsert, sbRpc } from "@/lib/supabase";
import { sendEmail, watchResultEmail } from "@/lib/emails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

interface WatchRow { id: string; token: string; email: string; flight_number: string; flight_date: string; departure_iata: string | null; passengers: number; status: string }

// Runs every 2 hours (vercel.json). Checks watched flights the day after they were due, emails the result.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const due = await sbRpc<WatchRow>("fcc_due_watches", { p_key: secret, p_limit: 25 });
  const out: { id: string; flight: string; verdict?: string; error?: string; mailed?: boolean }[] = [];
  for (const w of due) {
    try {
      const result = await runCheck({ flightNumber: w.flight_number, date: w.flight_date, disruption: "delay", departureIata: w.departure_iata || undefined, passengers: w.passengers });
      if ("error" in result) {
        // 404 = no record; leave it checked so we do not spend units forever, but tell the user by email.
        await sbRpc("fcc_mark_watch", { p_key: secret, p_id: w.id, p_status: "error", p_check_token: null, p_verdict: result.status === 404 ? "no_record" : "error", p_notified: false });
        out.push({ id: w.id, flight: w.flight_number, error: result.error });
        continue;
      }
      const checkToken = randomBytes(9).toString("base64url");
      await sbInsert("fcc_checks", { token: checkToken, flight_number: result.flight.number, flight_date: w.flight_date, input: result.input, result, ip_hash: createHash("sha256").update("watch:" + w.email).digest("hex").slice(0, 24) });
      const band = result.bands[0];
      const amountLabel = band ? `${band.currency === "GBP" ? "£" : "€"}${band.amount}` : null;
      const m = watchResultEmail({ token: w.token, checkToken, flightNumber: result.flight.number, date: w.flight_date, verdict: result.verdict, headline: result.headline, amountLabel, passengers: w.passengers, email: w.email, defence: result.defenceRisk.summary });
      const mail = await sendEmail(w.email, m.subject, m.html, m.text);
      await sbRpc("fcc_mark_watch", { p_key: secret, p_id: w.id, p_status: "checked", p_check_token: checkToken, p_verdict: result.verdict, p_notified: mail.sent });
      out.push({ id: w.id, flight: w.flight_number, verdict: result.verdict, mailed: mail.sent });
    } catch (e) {
      console.error("watch cron item failed", w.id, e);
      out.push({ id: w.id, flight: w.flight_number, error: (e as Error).message });
    }
  }
  return NextResponse.json({ processed: out.length, results: out });
}
