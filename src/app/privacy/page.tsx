import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacy", description: "What we collect, why, and for how long." };

export default function Privacy() {
  return (
    <div className="wrap prose" style={{ paddingTop: 40, maxWidth: 720 }}>
      <p className="eyebrow">Privacy</p>
      <h1 style={{ fontSize: "clamp(28px,4vw,40px)", marginTop: 8 }}>What we collect and why</h1>
      <h2>The free check</h2>
      <p>Flight number, date and disruption type, plus a one-way hash of your IP address to stop abuse of the flight data quota. No name, email or account. The result is stored against a random reference so the page can be reopened.</p>
      <h2>If you buy</h2>
      <p>Your name, postal address, email, booking reference and passenger names, because they go in the letter. Card details are handled by Stripe and never reach us. We use the email to deliver your documents and to answer questions about the order. We do not send marketing.</p>
      <h2>Lawful basis</h2>
      <p>Performance of a contract for the purchase; legitimate interests (fraud prevention and service operation) for the check and the IP hash.</p>
      <h2>Retention</h2>
      <p>Check results: 12 months. Orders and documents: 6 years, matching the limitation period for the claim they support, so you can come back to them. You can ask us to delete an order sooner once you have your copy.</p>
      <h2>Processors</h2>
      <p>Stripe (payments), Supabase (database, EU region), Vercel (hosting), Resend (email), Anthropic (drafting the letter text from the facts you supply; no training on your data), AeroDataBox (flight lookups by flight number and date only, no personal data sent).</p>
      <h2>Your rights</h2>
      <p>Access, correction, deletion, restriction and portability under UK GDPR. Email <a href="mailto:hello@flightdelaycheck.co.uk">hello@flightdelaycheck.co.uk</a>. You can complain to the Information Commissioner&apos;s Office at ico.org.uk.</p>
      <h2>Cookies</h2>
      <p>None for tracking. A session cookie may be set by Stripe during checkout.</p>
    </div>
  );
}
