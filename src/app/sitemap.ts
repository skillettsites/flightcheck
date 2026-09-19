import type { MetadataRoute } from "next";
import { AIRLINE_PAGES } from "@/data/airline-pages";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://flightdelaycheck.co.uk";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const core = ["", "/how-it-works", "/your-rights", "/uk261-compensation", "/eu261-compensation", "/flight-delay-compensation-calculator", "/airlines", "/pricing", "/refunds", "/terms", "/privacy", "/contact"].map((p) => ({
    url: `${SITE}${p}`,
    lastModified: now,
    changeFrequency: (p === "" ? "weekly" : "monthly") as "weekly" | "monthly",
    priority: p === "" ? 1 : ["/your-rights", "/uk261-compensation", "/eu261-compensation", "/flight-delay-compensation-calculator"].includes(p) ? 0.8 : 0.5,
  }));
  const airlines = AIRLINE_PAGES.map((a) => ({ url: `${SITE}/airlines/${a.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 }));
  return [...core, ...airlines];
}
