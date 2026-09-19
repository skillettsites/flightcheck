import { NextRequest, NextResponse } from "next/server";
import { sbRpc } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let b: { token?: string; id?: string };
  try { b = (await req.json()) as { token?: string; id?: string }; } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  if (!b.token) return NextResponse.json({ error: "token required" }, { status: 400 });
  const n = await sbRpc<number>("fcc_unsubscribe_watch", { p_token: b.token, p_id: b.id || null });
  return NextResponse.json({ removed: n[0] ?? 0 });
}
