import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://flightdelaycheck.co.uk";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ["", "/how-it-works", "/your-rights", "/pricing", "/refunds", "/terms", "/privacy", "/contact"].map((p) => ({
    url: `${SITE}${p}`,
    lastModified: now,
    changeFrequency: p === "" ? "weekly" : "monthly",
    priority: p === "" ? 1 : p === "/your-rights" ? 0.8 : 0.5,
  }));
}
