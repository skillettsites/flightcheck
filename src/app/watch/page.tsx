import type { Metadata } from "next";
import Link from "next/link";
import WatchForm from "@/components/WatchForm";
import JsonLd, { faqSchema } from "@/components/JsonLd";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://flightdelaycheck.co.uk";

export const metadata: Metadata = {
  title: "Flight Watch: we check your flights for compensation automatically",
  description: "Add your upcoming flights once. The morning after each one lands we check the record and email you if it was 3 hours late or cancelled, with the amount you are owed and a ready-to-send letter. Free to watch, £4.99 only if there is a claim.",
  alternates: { canonical: `${SITE}/watch` },
};

const FAQS = [
  { q: "What does Flight Watch actually do?", a: "You give us flight numbers and dates. The morning after each flight, we look up its recorded arrival time, work out the delay against schedule and check for cancellation. If it qualifies for UK261 or EU261 compensation you get an email with the amount per passenger, the airline's likely defence graded from the airport and weather records, and the option of a claim letter for £4.99. If it does not qualify you get a one-line all-clear." },
  { q: "Is it really free?", a: "Watching is free with no card and no subscription. You only ever pay if a flight qualifies and you choose to have the letter written. You can claim without buying anything; every result email links to the airline's own claim page." },
  { q: "Do I have to give you access to my email or calendar?", a: "No. Paste the confirmation text or type the flight numbers. We do not connect to your inbox." },
  { q: "How far ahead can I add flights?", a: "Up to a year ahead, and back to about ten months ago for flights you have already taken." },
  { q: "What if the flight number covers two legs?", a: "Add the departure airport code and we pick the right leg. For a connection, add each flight separately; the compensation is assessed at the final destination, and the letter handles that." },
  { q: "Can I add flights for family or friends?", a: "Yes, as long as the results go to your email. Set the passenger count and the letter will be written for the number travelling." },
];

export default function WatchPage() {
  return (
    <div className="wrap" style={{ paddingTop: 40, paddingBottom: 40 }}>
      <JsonLd data={faqSchema(FAQS)} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 40, alignItems: "start" }} className="hero">
        <div>
          <p className="eyebrow">Flight Watch · free</p>
          <h1 className="cond" style={{ maxWidth: "15ch" }}>Add your flights. If one is late enough to pay out, we tell you.</h1>
          <p className="muted" style={{ fontSize: 19, marginTop: 14, maxWidth: "36ch" }}>The morning after each flight lands we check the record. Three hours late or cancelled, and the verdict, the amount and the letter are in your inbox before you have unpacked.</p>
          <dl className="wfacts">
            <div><dt>Upfront</dt><dd>£0, no card</dd></div>
            <div><dt>Checked</dt><dd>Morning after landing</dd></div>
            <div><dt>Pays out at</dt><dd>3h 00m late or cancelled</dd></div>
            <div><dt>Letter, if owed</dt><dd>£4.99 (firms take £77 to £260)</dd></div>
          </dl>
          <p className="small muted" style={{ marginTop: 18 }}>About 1 in 60 European flights arrives 3 hours late or is cancelled. A family that flies four times a year hits it roughly once every four years, and the payout is £880 to £2,080.</p>
        </div>
        <WatchForm />
      </div>

      <section style={{ marginTop: 56 }} className="ledger">
        <div className="ledger-row">
          <span className="ledger-key">T minus anything</span>
          <span><strong>Add the flights</strong><br /><span className="small muted">Paste the confirmation email or type the numbers. Two seconds per flight. We do not connect to your inbox.</span></span>
          <span className="ledger-val muted">You</span>
        </div>
        <div className="ledger-row">
          <span className="ledger-key">T plus one morning</span>
          <span><strong>We read the record</strong><br /><span className="small muted">Actual arrival against schedule, cancellation status, the airport&apos;s delay causes and weather for the day.</span></span>
          <span className="ledger-val muted">Us</span>
        </div>
        <div className="ledger-row">
          <span className="ledger-key">If it qualifies</span>
          <span><strong>The letter is waiting</strong><br /><span className="small muted">One email: the amount, the evidence, the airline&apos;s likely defence, and the ready-to-send claim for £4.99. Or the free route, side by side.</span></span>
          <span className="ledger-val muted">Your call</span>
        </div>
      </section>

      <section style={{ marginTop: 48, maxWidth: 820 }}>
        <p className="eyebrow">Questions</p>
        {FAQS.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
        <p className="small muted" style={{ marginTop: 16 }}>Already flown? <Link href="/">Check a past flight now</Link>, no sign-up needed.</p>
      </section>
      <style>{`
        .wfacts { margin: 18px 0 0; display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; border-top: 1.5px solid var(--ink); padding-top: 14px; max-width: 460px; }
        .wfacts div { display: grid; gap: 2px; }
        .wfacts dt { font-family: var(--font-mono); font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-3); }
        .wfacts dd { margin: 0; font-family: var(--font-mono); font-size: 14.5px; }
        @media (max-width: 860px){ .hero { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
