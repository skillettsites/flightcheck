import { sbRpc } from "./supabase";
import { generateEscalation, generateLetter, type Customer } from "./letter";
import { sendDocumentsEmail } from "./email";
import type { CheckResult } from "./check";

export interface PurchaseRow {
  id: string;
  token: string;
  check_token: string;
  stripe_session_id: string | null;
  product: "letter" | "pack";
  amount_pence: number | null;
  currency: string | null;
  customer_email: string | null;
  customer_name: string | null;
  customer_address: string | null;
  booking_ref: string | null;
  passengers: number | null;
  letter_text: string | null;
  escalation_text: string | null;
  status: string;
  email_sent: boolean;
  created_at: string;
  paid_at: string | null;
}

/**
 * Single fulfilment path, callable from the webhook and from the success page (whichever gets there first).
 * Idempotent: a purchase that is already "ready" is returned untouched, so a double webhook cannot
 * generate a second letter.
 */
export async function fulfilPurchase(sessionId: string, extra: { amountPence: number | null; currency: string | null; email: string | null; passengerNames: string | null }): Promise<{ status: string; token?: string }> {
  const rows = await sbRpc<PurchaseRow>("fcc_get_purchase_by_session", { p_session_id: sessionId });
  const p = rows[0];
  if (!p) return { status: "no_purchase" };
  if (p.status === "ready" && p.letter_text) return { status: "already_ready", token: p.token };

  const checks = await sbRpc<{ token: string; result: CheckResult }>("fcc_get_check", { p_token: p.check_token });
  const check = checks[0];
  if (!check) return { status: "no_check", token: p.token };

  const customer: Customer = {
    name: p.customer_name || "",
    address: p.customer_address || "",
    email: extra.email || p.customer_email || "",
    bookingRef: p.booking_ref || undefined,
    passengers: p.passengers || 1,
    passengerNames: extra.passengerNames || undefined,
  };
  const today = new Date().toISOString().slice(0, 10);
  const letter = await generateLetter(check.result, customer, today);
  const escalation = p.product === "pack" ? await generateEscalation(check.result, customer, today, today) : null;

  const origin = process.env.NEXT_PUBLIC_SITE_URL || "";
  const reportUrl = `${origin}/r/${p.token}`;
  const mail = customer.email ? await sendDocumentsEmail({ to: customer.email, name: customer.name, reportUrl, product: p.product }) : { sent: false };

  await sbRpc("fcc_complete_purchase", {
    p_session_id: sessionId,
    p_amount_pence: extra.amountPence,
    p_currency: extra.currency,
    p_email: extra.email,
    p_name: null,
    p_address: null,
    p_booking_ref: null,
    p_passengers: null,
    p_letter: letter.text,
    p_escalation: escalation,
    p_email_sent: mail.sent,
  });
  return { status: "ready", token: p.token };
}
