import type { Metadata } from "next";
import Link from "next/link";
import CheckForm from "@/components/CheckForm";

export const metadata: Metadata = {
  title: "How the flight check works",
  description: "Where the data comes from, what the verdict means, what the letter contains and what we will never do.",
};

export default function HowItWorks() {
  return (
    <div className="wrap prose" style={{ paddingTop: 40, maxWidth: 780 }}>
      <p className="eyebrow">How it works</p>
      <h1 className="cond" style={{ fontSize: "clamp(34px,5vw,56px)", marginTop: 8 }}>A claim built on the record, not on a form you fill in from memory</h1>

      <h2>1. You give us a flight number and a date</h2>
      <p>That is all the check needs. We do not ask for your name, booking or card to give you the verdict. Flights from the last twelve months are verified automatically.</p>

      <h2>2. We pull three public records</h2>
      <ul>
        <li><strong>The flight record</strong> (AeroDataBox): scheduled and actual gate times at both ends, cancellation or diversion status, the operating airline and the great-circle distance that sets your compensation band.</li>
        <li><strong>Eurocontrol&apos;s daily airport delay record</strong>: every minute of air-traffic-management arrival delay attributed to each European airport, by cause code, since 2019. Weather, ATC strikes, ATC staffing, equipment failures and capacity restrictions all appear here when they happen. We check both airports on your day.</li>
        <li><strong>METAR weather observations</strong> at both airports in a six-hour window around your flight: visibility, gusts, thunderstorms, snow, fog, freezing rain.</li>
      </ul>

      <h2>3. The engine applies the regulation</h2>
      <p>Which regulation covers the route and the carrier, whether the arrival delay reaches three hours (or the cancellation notice rules apply), the distance band, the amount per passenger, and the limitation date. Then it grades the airline&apos;s likely &ldquo;extraordinary circumstances&rdquo; defence from the records: low when nothing shows up that day, high when Eurocontrol logged heavy weather or ATC delay at your airports.</p>

      <h2>4. You decide</h2>
      <p>The verdict page is free and stays free. If you want the letter, it is £4.99, written from the verified facts with the regulation, the article, the amount, the anticipated defence and the evidence in it. The £9.99 pack adds the follow-up letter for a refusal, the evidence appendix and the escalation route to the free ADR scheme. You send it. We never contact the airline.</p>

      <h2>What we will never do</h2>
      <ul>
        <li>Take a percentage of your compensation or handle the money.</li>
        <li>Contact the airline, the ADR scheme or a court on your behalf.</li>
        <li>Give you legal advice about your individual case. We are not a law firm and not a claims management company.</li>
        <li>Suggest credit-card or insurance routes. Those are financial services matters and not what we do.</li>
        <li>Hide that you can do this for free without us.</li>
      </ul>

      <h2>Accuracy</h2>
      <p>Gate times come from the airline&apos;s own operational data feeds where available; where only touchdown is recorded we say so and note that doors typically open 5 to 10 minutes later. Eurocontrol data is published monthly, so the latest few weeks may not be in yet; the check tells you when a day is outside the dataset. If any fact in a letter you paid for is wrong, tell us and we correct it or refund you.</p>

      <div style={{ marginTop: 30 }}>
        <p className="eyebrow" style={{ marginBottom: 10 }}>Try it</p>
        <CheckForm compact />
      </div>
      <p className="small muted" style={{ marginTop: 16 }}>Want the law first? <Link href="/your-rights">Your rights, article by article</Link>.</p>
    </div>
  );
}
