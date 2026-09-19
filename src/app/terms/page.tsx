import type { Metadata } from "next";
export const metadata: Metadata = { title: "Terms of use", description: "What we sell, what we do not do, and your rights." };

export default function Terms() {
  return (
    <div className="wrap prose" style={{ paddingTop: 40, maxWidth: 720 }}>
      <p className="eyebrow">Terms of use</p>
      <h1 style={{ fontSize: "clamp(28px,4vw,40px)", marginTop: 8 }}>What you are buying, and what you are not</h1>
      <h2>Who we are</h2>
      <p>FlightDelayCheck is a document preparation service operated from the United Kingdom. We are not a law firm, not a claims management company, and not authorised or regulated by the Financial Conduct Authority or the Solicitors Regulation Authority. Flight delay and cancellation claims under UK261 and EU261 are not a regulated claims-management sector, and we do not advise on personal injury, financial services, housing, employment or benefits claims.</p>
      <h2>What we sell</h2>
      <p>A free eligibility check based on public and licensed data, and, if you choose, a claim letter and supporting documents written from that data and the details you enter. The price is shown in full before payment and there are no further charges. We sell a document. You send it. We do not act as your agent, representative or intermediary, we never contact the airline, an ADR scheme or a court for you, and we take no share of anything you recover.</p>
      <h2>Not legal advice</h2>
      <p>The check and the documents are general information applied to the facts of your flight. They are not legal advice about your individual circumstances and no solicitor-client relationship arises. If your case is unusual, take advice from a solicitor or Citizens Advice.</p>
      <h2>You can do this for free</h2>
      <p>Every airline accepts claims directly, the CAA-approved ADR schemes are free to passengers, and free template letters are published by the CAA, Which? and MoneySavingExpert. Nothing on this site is required to make a claim.</p>
      <h2>Accuracy and data</h2>
      <p>Flight records come from AeroDataBox; airport delay data from Eurocontrol&apos;s Performance Review Unit; weather from the Iowa Environmental Mesonet METAR archive. We reproduce them in good faith but do not control them. Where the record is incomplete the page says so. You are responsible for checking that the personal details you enter, and the facts in the letter, are correct before you send it.</p>
      <h2>Payment, delivery and cancellation</h2>
      <p>Payment is taken by Stripe. Documents are produced immediately after payment where you have consented to immediate supply, which ends the statutory 14-day cancellation right for digital content. See the <a href="/refunds">refund policy</a>.</p>
      <h2>Liability</h2>
      <p>Nothing in these terms limits liability for death, personal injury, fraud or anything that cannot be limited by law. Otherwise our liability to you is limited to the price you paid for the document.</p>
      <h2>Complaints</h2>
      <p>Email <a href="mailto:hello@flightdelaycheck.co.uk">hello@flightdelaycheck.co.uk</a>. We acknowledge within 2 working days and aim to resolve within 10. If you are unhappy with our answer you may use the EU/UK online dispute or small claims routes.</p>
      <h2>Law</h2>
      <p>These terms are governed by the law of England and Wales. Last updated September 2026.</p>
    </div>
  );
}
