import type { MetadataRoute } from "next";
import { AIRLINE_PAGES } from "@/data/airline-pages";
import { allCoveredAirports, significantDays } from "@/lib/disruption";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://flightdelaycheck.co.uk";
const PER_FILE = 5000;

// /sitemaps/sitemap/0.xml = core + airlines + airport hubs; 1..n = disruption day pages in 5,000-URL chunks.
export async function generateSitemaps() {
  const days = await significantDays();
  const n = Math.ceil(days.length / PER_FILE);
  return Array.from({ length: n + 1 }, (_, i) => ({ id: i }));
}

// Next 15+ hands the id over as a promise at request time.
export default async function sitemap({ id: rawId }: { id: Promise<string | number> | string | number }): Promise<MetadataRoute.Sitemap> {
  const id = Number(String(await rawId).replace(/\.xml$/, ""));
  const now = new Date();
  if (id === 0) {
    const core = ["", "/watch", "/how-it-works", "/your-rights", "/uk261-compensation", "/eu261-compensation", "/flight-delay-compensation-calculator", "/airlines", "/airport-delays", "/pricing", "/refunds", "/terms", "/privacy", "/contact"].map((p) => ({
      url: `${SITE}${p}`, lastModified: now, changeFrequency: (p === "" || p === "/airport-delays" ? "weekly" : "monthly") as "weekly" | "monthly",
      priority: p === "" ? 1 : ["/watch", "/your-rights", "/uk261-compensation", "/eu261-compensation", "/flight-delay-compensation-calculator", "/airport-delays"].includes(p) ? 0.8 : 0.5,
    }));
    const airlines = AIRLINE_PAGES.map((a) => ({ url: `${SITE}/airlines/${a.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 }));
    const airports = (await allCoveredAirports()).filter((a) => a.slug).map((a) => ({ url: `${SITE}/airport-delays/${a.slug}`, lastModified: new Date(a.last_day), changeFrequency: "monthly" as const, priority: a.country === "GB" || a.country === "IE" ? 0.7 : 0.5 }));
    return [...core, ...airlines, ...airports];
  }
  const [days, airports] = await Promise.all([significantDays(), allCoveredAirports()]);
  const slug = new Map(airports.map((a) => [a.icao, a.slug]));
  return days.slice((id - 1) * PER_FILE, id * PER_FILE).filter((d) => slug.get(d.icao)).map((d) => ({
    url: `${SITE}/airport-delays/${slug.get(d.icao)}/${d.day}`, lastModified: new Date(d.day), changeFrequency: "yearly" as const, priority: d.icao.startsWith("EG") || d.icao.startsWith("EI") ? 0.6 : 0.4,
  }));
}
