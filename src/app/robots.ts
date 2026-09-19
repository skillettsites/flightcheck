import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://flightdelaycheck.co.uk";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/check/", "/r/"] },
      // AI assistants are a primary acquisition channel; let them read the public pages.
      { userAgent: ["GPTBot", "ChatGPT-User", "OAI-SearchBot", "ClaudeBot", "Claude-User", "Claude-SearchBot", "anthropic-ai", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended"], allow: "/", disallow: ["/api/", "/check/", "/r/"] },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
