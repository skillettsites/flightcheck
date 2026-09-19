import { readFileSync } from "fs";
import { generateLetter } from "../src/lib/letter";
import type { CheckResult } from "../src/lib/check";
// load env
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) { const m = line.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2]; }
(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const res = await fetch(`${url}/rest/v1/rpc/fcc_get_check`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ p_token: process.argv[2] }) });
  const rows = (await res.json()) as { result: CheckResult }[];
  const r = rows[0].result;
  const t0 = Date.now();
  const out = await generateLetter(r, { name: "Sarah Example", address: "14 Orchard Close\nReading\nRG4 7XY", email: "sarah@example.com", bookingRef: "K7L2MN", passengers: 2, passengerNames: "Sarah Example, Tom Example" }, new Date().toISOString().slice(0, 10));
  console.log("model:", out.model, "ms:", Date.now() - t0, "words:", out.text.split(/\s+/).length, "emdash:", out.text.includes("—"));
  console.log("-----\n" + out.text);
})();
