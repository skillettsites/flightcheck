import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { runCheck, type CheckInput } from "@/lib/check";
import { sbInsert } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Crude per-IP throttle so a bot cannot burn the AeroDataBox quota. Vercel functions are
// short-lived, so this only holds within a warm instance; the Supabase log is the durable record.
const recent = new Map<string, number[]>();
function throttled(ip: string): boolean {
  const now = Date.now();
  const arr = (recent.get(ip) ?? []).filter((t) => now - t < 60_000);
  arr.push(now);
  recent.set(ip, arr);
  return arr.length > 6;
}

export async function POST(req: NextRequest) {
  let body: Partial<CheckInput>;
  try {
    body = (await req.json()) as Partial<CheckInput>;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (throttled(ip)) return NextResponse.json({ error: "Too many checks from this connection. Please wait a minute." }, { status: 429 });

  const disruption = body.disruption === "cancellation" || body.disruption === "denied_boarding" ? body.disruption : "delay";
  const input: CheckInput = {
    flightNumber: String(body.flightNumber || "").trim(),
    date: String(body.date || "").trim(),
    disruption,
    departureIata: body.departureIata ? String(body.departureIata).trim().toUpperCase() : undefined,
    bookedArrivalIata: body.bookedArrivalIata ? String(body.bookedArrivalIata).trim().toUpperCase() : undefined,
    noticeDays: typeof body.noticeDays === "number" ? body.noticeDays : body.noticeDays === null ? null : undefined,
    reroutedWithinLimits: typeof body.reroutedWithinLimits === "boolean" ? body.reroutedWithinLimits : undefined,
    passengers: Math.min(9, Math.max(1, Number(body.passengers) || 1)),
  };
  if (!input.flightNumber || !input.date) return NextResponse.json({ error: "Flight number and date are required." }, { status: 400 });

  // AeroDataBox Basic serves ±365 days. Refuse older dates up front rather than paying for a 404.
  const d = new Date(input.date + "T00:00:00Z");
  const ageDays = (Date.now() - d.getTime()) / 86_400_000;
  if (isNaN(d.getTime())) return NextResponse.json({ error: "Please enter a valid date." }, { status: 400 });
  if (ageDays > 365) return NextResponse.json({ error: "We can currently verify flights from the last 12 months. Older flights can still be claimed (up to 6 years in England and Wales); email us the details and we will check it by hand." }, { status: 422 });
  if (ageDays < -1) return NextResponse.json({ error: "That date is in the future." }, { status: 400 });

  const result = await runCheck(input);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  const token = randomBytes(9).toString("base64url");
  const ipHash = createHash("sha256").update(ip + (process.env.IP_HASH_SALT || "fcc")).digest("hex").slice(0, 24);
  await sbInsert("fcc_checks", {
    token,
    flight_number: result.flight.number,
    flight_date: input.date,
    input,
    result,
    ip_hash: ipHash,
  });
  return NextResponse.json({ token, result });
}
