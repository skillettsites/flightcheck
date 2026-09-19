// Thin PostgREST client using the anon key only. Reads of customer data go through
// SECURITY DEFINER RPCs so the anon role can never list a table.
const URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function headers(extra: Record<string, string> = {}) {
  return { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", ...extra };
}

export function supabaseConfigured(): boolean {
  return Boolean(URL && KEY);
}

export async function sbSelect<T>(table: string, query: string): Promise<T[]> {
  if (!supabaseConfigured()) return [];
  const res = await fetch(`${URL}/rest/v1/${table}?${query}`, { headers: headers(), cache: "no-store" });
  if (!res.ok) {
    console.error("supabase select failed", table, res.status, await res.text().catch(() => ""));
    return [];
  }
  return (await res.json()) as T[];
}

export async function sbInsert(table: string, row: Record<string, unknown>): Promise<boolean> {
  if (!supabaseConfigured()) return false;
  const res = await fetch(`${URL}/rest/v1/${table}`, {
    method: "POST",
    headers: headers({ Prefer: "return=minimal" }),
    body: JSON.stringify(row),
  });
  if (!res.ok) console.error("supabase insert failed", table, res.status, await res.text().catch(() => ""));
  return res.ok;
}

export async function sbRpc<T>(fn: string, args: Record<string, unknown>): Promise<T[]> {
  if (!supabaseConfigured()) return [];
  const res = await fetch(`${URL}/rest/v1/rpc/${fn}`, { method: "POST", headers: headers(), body: JSON.stringify(args), cache: "no-store" });
  if (!res.ok) {
    console.error("supabase rpc failed", fn, res.status, await res.text().catch(() => ""));
    return [];
  }
  const data = await res.json();
  return Array.isArray(data) ? (data as T[]) : data === null ? [] : [data as T];
}
