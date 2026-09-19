import { NextRequest, NextResponse } from "next/server";
import { sbRpc } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = new Set(["paid", "partial", "refused", "adr", "nothing"]);

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";
  const outcome = req.nextUrl.searchParams.get("outcome") || "";
  const origin = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
  if (!token || !ALLOWED.has(outcome)) return NextResponse.redirect(`${origin}/`);
  await sbRpc("fcc_set_outcome", { p_token: token, p_outcome: outcome });
  return NextResponse.redirect(`${origin}/r/${token}?outcome=${outcome}`);
}
