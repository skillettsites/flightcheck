// Thin PostgREST client using the anon key only. Reads of customer data go through
// SECURITY DEFINER RPCs so the anon role can never list a table.
// Server-only: this module is imported by route handlers and server components, never shipped to the browser.
const URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function headers(extra: Record<string, string> = {}) {
  return { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", ...extra };
}

export function supabaseConfigured(): boolean {
  return Boolean(URL && KEY);
}

export async function sbSelect<T>(table: string, query: string, revalidate?: number): Promise<T[]> {
  if (!supabaseConfigured()) return [];
  const res = await fetch(`${URL}/rest/v1/${table}?${query}`, { headers: headers(), ...(revalidate ? { next: { revalidate } } : { cache: "no-store" as const }) });
  if (!res.ok) {
    console.error("supabase select failed", table, res.status, await res.text().catch(() => ""));
    return [];
  }
  return (await res.json()) as T[];
}

/** Same as sbSelect but lets Next cache the response for ISR pages (seconds). */
export async function sbSelectCached<T>(table: string, query: string, revalidate: number): Promise<T[]> {
  if (!supabaseConfigured()) return [];
  const res = await fetch(`${URL}/rest/v1/${table}?${query}`, { headers: headers(), next: { revalidate } });
  if (!res.ok) {
    console.error("supabase select failed", table, res.status, await res.text().catch(() => ""));
    return [];
  }
  return (await res.json()) as T[];
}

/** Page through a large result set; Supabase caps a single response at 1,000 rows. */
export async function sbSelectAll<T>(table: string, query: string, pageSize = 1000, maxRows = 60000): Promise<T[]> {
  if (!supabaseConfigured()) return [];
  const out: T[] = [];
  for (let start = 0; start < maxRows; start += pageSize) {
    const res = await fetch(`${URL}/rest/v1/${table}?${query}`, { headers: headers({ Range: `${start}-${start + pageSize - 1}`, "Range-Unit": "items" }), cache: "no-store" });
    if (!res.ok && res.status !== 416) { console.error("supabase selectAll failed", table, res.status, await res.text().catch(() => "")); break; }
    if (res.status === 416) break;
    const rows = (await res.json()) as T[];
    out.push(...rows);
    if (rows.length < pageSize) break;
  }
  return out;
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

export async function sbRpc<T>(fn: string, args: Record<string, unknown>, revalidate?: number): Promise<T[]> {
  if (!supabaseConfigured()) return [];
  const res = await fetch(`${URL}/rest/v1/rpc/${fn}`, { method: "POST", headers: headers(), body: JSON.stringify(args), ...(revalidate ? { next: { revalidate } } : { cache: "no-store" as const }) });
  if (!res.ok) {
    console.error("supabase rpc failed", fn, res.status, await res.text().catch(() => ""));
    return [];
  }
  const text = await res.text();
  if (!text.trim()) return []; // void RPCs answer 204 with an empty body
  const data = JSON.parse(text);
  return Array.isArray(data) ? (data as T[]) : data === null ? [] : [data as T];
}
