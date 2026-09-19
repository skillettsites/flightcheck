import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { randomBytes } from "crypto";
import { PRODUCTS, type ProductId } from "@/lib/products";
import { sbInsert, sbRpc } from "@/lib/supabase";
import type { CheckResult } from "@/lib/check";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  checkToken: string;
  product: ProductId;
  name: string;
  address: string;
  email: string;
  bookingRef?: string;
  passengers?: number;
  passengerNames?: string;
  consent: boolean; // reg 37 Consumer Contracts Regulations: immediate supply, cancellation right lost
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Payments are not configured yet." }, { status: 503 });
  let b: Body;
  try {
    b = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const product = PRODUCTS[b.product];
  if (!product) return NextResponse.json({ error: "Unknown product" }, { status: 400 });
  if (!b.checkToken || !b.name?.trim() || !b.address?.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.email || "")) {
    return NextResponse.json({ error: "Name, postal address and a valid email are needed to write the letter." }, { status: 400 });
  }
  if (!b.consent) return NextResponse.json({ error: "Please tick the box confirming you want the documents produced straight away." }, { status: 400 });

  const checks = await sbRpc<{ token: string; result: CheckResult }>("fcc_get_check", { p_token: b.checkToken });
  const check = checks[0];
  if (!check) return NextResponse.json({ error: "That check has expired. Run it again." }, { status: 404 });

  const passengers = Math.min(9, Math.max(1, Number(b.passengers) || 1));
  const token = randomBytes(9).toString("base64url");
  const ok = await sbInsert("fcc_purchases", {
    token,
    check_token: b.checkToken,
    product: product.id,
    amount_pence: product.pricePence,
    currency: "gbp",
    customer_email: b.email.trim(),
    customer_name: b.name.trim(),
    customer_address: b.address.trim(),
    booking_ref: (b.bookingRef || "").trim() || null,
    passengers,
    status: "pending",
  });
  if (!ok) return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 500 });

  const origin = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
  const stripe = new Stripe(secret);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: b.email.trim(),
    allow_promotion_codes: true,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: product.pricePence,
          product_data: {
            name: `${product.name}: flight ${check.result.flight.number} on ${check.result.input.date}`,
            description: product.description,
          },
        },
      },
    ],
    metadata: {
      site: "flightdelaycheck",
      purchase_token: token,
      check_token: b.checkToken,
      product: product.id,
      passengers: String(passengers),
      passenger_names: (b.passengerNames || "").slice(0, 400),
      flight: check.result.flight.number,
      flight_date: check.result.input.date,
    },
    success_url: `${origin}/r/${token}?paid=1`,
    cancel_url: `${origin}/check/${b.checkToken}?cancelled=1`,
  });
  await sbRpc("fcc_attach_session", { p_token: token, p_session_id: session.id });
  return NextResponse.json({ url: session.url });
}
