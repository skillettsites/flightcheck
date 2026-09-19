import { significantDays } from "@/lib/disruption";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://flightdelaycheck.co.uk";
export const revalidate = 86400;

// Sitemap index pointing at the chunked sitemaps Next generates under /sitemaps/sitemap/{id}.xml
export async function GET() {
  const days = await significantDays();
  const n = Math.ceil(days.length / 5000);
  const items = Array.from({ length: n + 1 }, (_, i) => `<sitemap><loc>${SITE}/sitemaps/sitemap/${i}.xml</loc></sitemap>`).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</sitemapindex>`, { headers: { "Content-Type": "application/xml" } });
}
