import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { parseFlightNumber } from "@/lib/airlines";
import { sbInsert, sbRpc } from "@/lib/supabase";
import { confirmWatchEmail, emailConfigured, sendEmail } from "@/lib/emails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface FlightIn { flightNumber: string; date: string; departureIata?: string; passengers?: number }
interface Body { email: string; flights: FlightIn[]; token?: string }

export async function POST(req: NextRequest) {
  let b: Body;
  try { b = (await req.json()) as Body; } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  const email = String(b.email || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  const flights = (b.flights || []).slice(0, 12).map((f) => {
    const p = parseFlightNumber(String(f.flightNumber || ""));
    return p && /^\d{4}-\d{2}-\d{2}$/.test(String(f.date || "")) ? { flightNumber: p.full, date: f.date, departureIata: f.departureIata ? String(f.departureIata).toUpperCase().slice(0, 3) : null, passengers: Math.min(9, Math.max(1, Number(f.passengers) || 1)) } : null;
  }).filter((f): f is NonNullable<typeof f> => f !== null);
  if (!flights.length) return NextResponse.json({ error: "Add at least one flight with a number and a date." }, { status: 400 });

  // Reuse the caller's existing token (manage page adds) or mint one for a new sign-up.
  let token = b.token && /^[A-Za-z0-9_-]{8,}$/.test(b.token) ? b.token : null;
  let existingConfirmed = false;
  if (token) {
    const rows = await sbRpc<{ email: string; status: string }>("fcc_get_watches", { p_token: token });
    if (!rows.length || rows[0].email.toLowerCase() !== email) token = null;
    else existingConfirmed = rows.some((r) => r.status === "confirmed" || r.status === "checked");
  }
  if (!token) token = randomBytes(9).toString("base64url");

  // With no outbound email configured we cannot run double opt-in, so watches go live directly.
  const status = existingConfirmed || !emailConfigured() ? "confirmed" : "pending";
  for (const f of flights) {
    await sbInsert("fcc_watches", { token, email, flight_number: f.flightNumber, flight_date: f.date, departure_iata: f.departureIata, passengers: f.passengers, status, confirmed_at: status === "confirmed" ? new Date().toISOString() : null });
  }
  let mailed = false;
  if (status === "pending") {
    const m = confirmWatchEmail(token, flights);
    mailed = (await sendEmail(email, m.subject, m.html, m.text)).sent;
  }
  return NextResponse.json({ token, status, mailed, count: flights.length });
}
