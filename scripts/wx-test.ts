import { weatherAround } from "../src/lib/metar";
(async () => {
  const r = await weatherAround("EGLL", new Date("2026-09-15T07:20:00Z"));
  console.log(JSON.stringify(r, null, 1));
})();
