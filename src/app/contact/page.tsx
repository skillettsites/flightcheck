import type { Metadata } from "next";
export const metadata: Metadata = { title: "Contact", description: "Questions about a check or an order, and flights older than 12 months." };

export default function Contact() {
  return (
    <div className="wrap prose" style={{ paddingTop: 40, maxWidth: 720 }}>
      <p className="eyebrow">Contact</p>
      <h1 style={{ fontSize: "clamp(28px,4vw,40px)", marginTop: 8 }}>Email works best</h1>
      <p style={{ fontSize: 18 }}><a href="mailto:hello@flightdelaycheck.co.uk">hello@flightdelaycheck.co.uk</a></p>
      <h2>Flights older than 12 months</h2>
      <p>The automatic check covers the last year. Claims run for six years in England and Wales, so if your flight is older, send the flight number, date and route and we will look it up by hand and tell you whether it is worth pursuing before you pay anything.</p>
      <h2>Something wrong in a letter</h2>
      <p>Send the order reference and what is wrong. We correct facts within 2 working days or refund you.</p>
      <h2>What we cannot help with</h2>
      <p>We cannot chase the airline for you, advise on your specific legal position, or handle personal injury, insurance or card disputes. For free advice on an individual case, Citizens Advice and the CAA&apos;s passenger pages are the right places.</p>
    </div>
  );
}
