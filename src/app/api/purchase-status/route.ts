import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { sbRpc } from "@/lib/supabase";
import { fulfilPurchase, type PurchaseRow } from "@/lib/fulfil";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Polled by /r/[token] after checkout. If the webhook has not landed yet, verify the session with
// Stripe directly and fulfil from here, so the customer never waits on webhook delivery.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });
  const rows = await sbRpc<PurchaseRow>("fcc_get_purchase", { p_token: token });
  const p = rows[0];
  if (!p) return NextResponse.json({ status: "not_found" }, { status: 404 });
  if (p.status === "ready") return NextResponse.json({ status: "ready" });
  if (!p.stripe_session_id || !process.env.STRIPE_SECRET_KEY) return NextResponse.json({ status: p.status });
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const s = await stripe.checkout.sessions.retrieve(p.stripe_session_id);
    if (s.payment_status === "paid" || s.amount_total === 0) {
      const out = await fulfilPurchase(s.id, {
        amountPence: s.amount_total ?? null,
        currency: s.currency ?? null,
        email: s.customer_details?.email ?? s.customer_email ?? null,
        passengerNames: s.metadata?.passenger_names || null,
      });
      return NextResponse.json({ status: out.status === "ready" || out.status === "already_ready" ? "ready" : out.status });
    }
    return NextResponse.json({ status: "awaiting_payment" });
  } catch (e) {
    console.error("purchase-status", e);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
