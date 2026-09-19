import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Pull flights out of a pasted booking confirmation. Cheap model, strict JSON, nothing stored.
export async function POST(req: NextRequest) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ error: "Parsing is not available right now; add the flights by hand." }, { status: 503 });
  let text = "";
  try { text = String(((await req.json()) as { text?: string }).text || "").slice(0, 12000); } catch { /* fallthrough */ }
  if (text.trim().length < 20) return NextResponse.json({ error: "Paste the confirmation email text, including the flight numbers and dates." }, { status: 400 });
  const client = new Anthropic({ apiKey: key });
  const today = new Date().toISOString().slice(0, 10);
  try {
    const msg = await client.messages.create({
      model: process.env.PARSE_MODEL || "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: `Extract airline flights from a booking confirmation. Today is ${today}. Return STRICT JSON only: {"flights":[{"flightNumber":"BA117","date":"YYYY-MM-DD","from":"LHR","to":"JFK","passengers":2}]}. flightNumber = IATA airline code + digits with no space. date = local departure date. from/to = IATA codes if present, else null. passengers = number of named passengers if shown, else 1. If a year is missing, choose the next occurrence on or after today. Ignore hotels, cars and trains. If nothing is found return {"flights":[]}.`,
      messages: [{ role: "user", content: text }],
    });
    const raw = msg.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
    const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
    const parsed = JSON.parse(json) as { flights: { flightNumber: string; date: string; from?: string | null; to?: string | null; passengers?: number }[] };
    return NextResponse.json({ flights: (parsed.flights || []).slice(0, 12) });
  } catch (e) {
    console.error("parse failed", e);
    return NextResponse.json({ error: "Could not read that text. Add the flights by hand." }, { status: 422 });
  }
}
