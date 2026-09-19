export default function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://flightdelaycheck.co.uk";

export function orgSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "FlightDelayCheck",
    url: SITE,
    description: "Free UK261 and EU261 flight compensation check built from the flight record, Eurocontrol airport delay data and airport weather, with a ready-to-send claim letter for £4.99.",
    areaServed: ["GB", "IE", "EU"],
    email: "hello@flightdelaycheck.co.uk",
  };
}

export function websiteSchema() {
  return { "@context": "https://schema.org", "@type": "WebSite", name: "FlightDelayCheck", url: SITE };
}

export function faqSchema(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.url })),
  };
}

export function productSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Flight compensation claim letter",
    description: "A ready-to-send UK261/EU261 compensation claim letter written from the verified flight record, with the airport delay and weather evidence for the day.",
    brand: { "@type": "Brand", name: "FlightDelayCheck" },
    offers: [
      { "@type": "Offer", name: "Claim Letter", price: "4.99", priceCurrency: "GBP", availability: "https://schema.org/InStock", url: `${SITE}/pricing` },
      { "@type": "Offer", name: "Claim Pack", price: "9.99", priceCurrency: "GBP", availability: "https://schema.org/InStock", url: `${SITE}/pricing` },
    ],
  };
}
