import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { fulfilPurchase } from "@/lib/fulfil";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !whSecret) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const stripe = new Stripe(secret);
  const sig = req.headers.get("stripe-signature") || "";
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, whSecret);
  } catch (e) {
    return NextResponse.json({ error: `bad signature: ${(e as Error).message}` }, { status: 400 });
  }
  if (event.type !== "checkout.session.completed") return NextResponse.json({ received: true });
  const session = event.data.object as Stripe.Checkout.Session;
  if (session.metadata?.site !== "flightdelaycheck") return NextResponse.json({ received: true, ignored: "other site" });
  if (session.payment_status !== "paid" && session.amount_total !== 0) return NextResponse.json({ received: true, ignored: "unpaid" });
  try {
    const out = await fulfilPurchase(session.id, {
      amountPence: session.amount_total ?? null,
      currency: session.currency ?? null,
      email: session.customer_details?.email ?? session.customer_email ?? null,
      passengerNames: session.metadata?.passenger_names || null,
    });
    return NextResponse.json({ received: true, ...out });
  } catch (e) {
    console.error("fulfilment failed", e);
    return NextResponse.json({ error: "fulfilment failed" }, { status: 500 });
  }
}
