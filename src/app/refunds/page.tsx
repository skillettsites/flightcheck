import type { Metadata } from "next";
export const metadata: Metadata = { title: "Refunds and cancellation", description: "When you can cancel, when we refund, and how to ask." };

export default function Refunds() {
  return (
    <div className="wrap prose" style={{ paddingTop: 40, maxWidth: 720 }}>
      <p className="eyebrow">Refunds and cancellation</p>
      <h1 style={{ fontSize: "clamp(28px,4vw,40px)", marginTop: 8 }}>Plain terms</h1>
      <h2>Your cancellation right</h2>
      <p>Our documents are digital content supplied instantly. Under the Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013 you have a 14-day right to cancel unless you asked us to start supply straight away and acknowledged that doing so ends that right. The tick box at checkout is that request and acknowledgement. If you did not tick it, supply does not start and you keep the full 14 days.</p>
      <h2>When we refund anyway</h2>
      <ul>
        <li>A material fact in your letter is wrong because our data was wrong (times, distance, regulation, amount) and we cannot correct it within 2 working days.</li>
        <li>The letter was not delivered to you at all within 24 hours.</li>
        <li>You were charged twice for the same check.</li>
      </ul>
      <h2>When we do not</h2>
      <ul>
        <li>The airline refuses or ignores your claim. The letter is a document; the outcome depends on the airline and, if you escalate, on the ADR scheme or court.</li>
        <li>You bought the letter for a flight our verdict already said was not eligible or borderline. The verdict is shown before payment.</li>
      </ul>
      <h2>How to ask</h2>
      <p>Reply to your confirmation email or write to <a href="mailto:hello@flightdelaycheck.co.uk">hello@flightdelaycheck.co.uk</a> with your order reference. We answer within 2 working days and refunds go back to the card used, usually within 5 to 10 days.</p>
    </div>
  );
}
