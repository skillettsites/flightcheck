import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { refineCheck, type CheckResult } from "@/lib/check";
import { sbInsert, sbRpc } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The flight record decides delayed vs cancelled on its own. Two things it cannot know come here:
// the notice a cancellation came with, and being bumped from a flight that ran. Re-evaluates the
// stored check (no API spend) and files it as a new check row so the old link keeps its meaning.
export async function POST(req: NextRequest) {
  let body: { token?: string; noticeDays?: number | null; reroutedWithinLimits?: boolean | null; deniedBoarding?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  const token = String(body.token || "");
  if (!/^[A-Za-z0-9_-]{8,24}$/.test(token)) return NextResponse.json({ error: "Unknown check." }, { status: 400 });
  const rows = await sbRpc<{ token: string; result: CheckResult }>("fcc_get_check", { p_token: token });
  const prev = rows[0]?.result;
  if (!prev) return NextResponse.json({ error: "That check has expired. Run it again from the home page." }, { status: 404 });

  const result = refineCheck(prev, {
    noticeDays: typeof body.noticeDays === "number" ? body.noticeDays : body.noticeDays === null ? null : undefined,
    reroutedWithinLimits: typeof body.reroutedWithinLimits === "boolean" ? body.reroutedWithinLimits : body.reroutedWithinLimits === null ? null : undefined,
    deniedBoarding: body.deniedBoarding === true,
  });
  const newToken = randomBytes(9).toString("base64url");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipHash = createHash("sha256").update(ip + (process.env.IP_HASH_SALT || "fcc")).digest("hex").slice(0, 24);
  const ok = await sbInsert("fcc_checks", { token: newToken, flight_number: result.flight.number, flight_date: result.input.date, input: result.input, result, ip_hash: ipHash });
  if (!ok) return NextResponse.json({ error: "Could not save the update. Please try again." }, { status: 500 });
  return NextResponse.json({ token: newToken, result });
}
