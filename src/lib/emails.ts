import { Resend } from "resend";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://flightdelaycheck.co.uk";

export function emailConfigured(): boolean {
  return Boolean((process.env.RESEND_API_KEY || "").trim() && (process.env.FROM_EMAIL || "").trim());
}

export async function sendEmail(to: string, subject: string, html: string, text?: string): Promise<{ sent: boolean; id?: string; reason?: string }> {
  const key = (process.env.RESEND_API_KEY || "").replace(/\\n$/, "").trim();
  const from = (process.env.FROM_EMAIL || "").trim();
  if (!key || !from) return { sent: false, reason: "email not configured" };
  try {
    const resend = new Resend(key);
    const res = await resend.emails.send({ from, to, subject, html, text });
    if (res.error) return { sent: false, reason: res.error.message };
    return { sent: true, id: res.data?.id };
  } catch (e) {
    return { sent: false, reason: (e as Error).message };
  }
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

function shell(title: string, bodyHtml: string, footerNote: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f5f7fb;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0e1b2e">
<div style="max-width:600px;margin:0 auto;padding:28px 20px">
  <div style="font-weight:800;font-size:18px;margin-bottom:18px">FlightDelayCheck</div>
  <div style="background:#fff;border:1px solid #d5dce6;border-radius:10px;padding:24px">
    <h1 style="font-size:22px;line-height:1.2;margin:0 0 12px">${esc(title)}</h1>
    ${bodyHtml}
  </div>
  <p style="font-size:12px;color:#6e7b8f;line-height:1.5;margin-top:16px">${footerNote} We are a document service, not a law firm or claims company; you can claim from any airline for free and we never contact the airline for you.</p>
</div></body></html>`;
}

const btn = (href: string, label: string) => `<p style="margin:18px 0"><a href="${href}" style="display:inline-block;background:#0e1b2e;color:#fff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:6px">${esc(label)}</a></p>`;

export function confirmWatchEmail(token: string, flights: { flightNumber: string; date: string }[]) {
  const url = `${SITE}/watch/${token}?confirm=1`;
  const list = flights.map((f) => `<li><strong>${esc(f.flightNumber)}</strong> on ${esc(f.date)}</li>`).join("");
  return {
    subject: `Confirm: watch ${flights.length === 1 ? flights[0].flightNumber : `${flights.length} flights`} for compensation`,
    html: shell("One click to start watching", `<p>You asked us to watch these flights and tell you if any of them arrive 3 hours late or get cancelled:</p><ul>${list}</ul><p>Confirm and we check each one the morning after it lands. If it qualifies you get the verdict and the option of a ready-to-send claim letter. If it does not, you get a short all-clear.</p>${btn(url, "Confirm my flight watch")}<p style="font-size:13px;color:#445266">Not you? Ignore this email and nothing happens.</p>`, `You received this because ${esc(flights[0]?.flightNumber ?? "a flight")} was added at ${SITE}/watch.`),
    text: `Confirm your flight watch: ${url}`,
  };
}

export function watchResultEmail(args: { token: string; checkToken: string; flightNumber: string; date: string; verdict: string; headline: string; amountLabel: string | null; passengers: number; email: string; defence: string }) {
  const manage = `${SITE}/watch/${args.token}`;
  const check = `${SITE}/check/${args.checkToken}?email=${encodeURIComponent(args.email)}&pax=${args.passengers}`;
  if (args.verdict === "claim" || args.verdict === "borderline") {
    const total = args.amountLabel ? `${args.amountLabel}${args.passengers > 1 ? ` × ${args.passengers}` : ""}` : "compensation";
    return {
      subject: `${args.flightNumber} on ${args.date}: you are owed ${args.amountLabel ?? "compensation"}${args.passengers > 1 ? " each" : ""}`,
      html: shell(args.headline, `<p>We checked <strong>${esc(args.flightNumber)}</strong> on ${esc(args.date)} against the flight record this morning. ${esc(args.verdict === "borderline" ? "It qualifies, though the airport record gives the airline something to argue, so the letter is written to deal with that." : "It qualifies, and nothing on the public record that day supports an extraordinary-circumstances defence.")}</p><p style="font-size:14px;color:#445266">${esc(args.defence)}</p><p>Your claim: <strong>${esc(total)}</strong>. Claims firms would keep 35% to 50% of it. The ready-to-send letter is £4.99, once.</p>${btn(check, "See the verdict and get the letter")}<p style="font-size:13px;color:#445266">Everything you need to claim for free is on the same page too.</p>`, `You are receiving this because you asked us to watch this flight. <a href="${manage}">Manage or stop your flight watch</a>.`),
      text: `${args.headline} See the verdict: ${check}`,
    };
  }
  if (args.verdict === "unclear") {
    return {
      subject: `${args.flightNumber} on ${args.date}: cancelled, one detail decides your claim`,
      html: shell("Your flight shows as cancelled", `<p>The record shows <strong>${esc(args.flightNumber)}</strong> on ${esc(args.date)} was cancelled. Whether compensation is due depends on how much notice you were given and whether you were re-routed close to the original times.</p>${btn(`${SITE}/?flight=${encodeURIComponent(args.flightNumber)}&date=${args.date}&disruption=cancellation`, "Answer two questions for the verdict")}<p style="font-size:13px;color:#445266">You are always owed a refund or re-routing and care for a cancellation, whatever the compensation position.</p>`, `You are receiving this because you asked us to watch this flight. <a href="${manage}">Manage or stop your flight watch</a>.`),
      text: `${args.flightNumber} on ${args.date} was cancelled. Verdict: ${SITE}/?flight=${args.flightNumber}&date=${args.date}&disruption=cancellation`,
    };
  }
  return {
    subject: `${args.flightNumber} on ${args.date}: all clear, nothing to claim`,
    html: shell("All clear", `<p>We checked <strong>${esc(args.flightNumber)}</strong> on ${esc(args.date)}. ${esc(args.headline)}</p><p style="font-size:14px;color:#445266">Compensation needs an arrival delay of 3 hours or more. Under that, nothing is owed beyond care during the delay.</p>${btn(check, "See the record")}<p>We will watch your next flight the same way. Add flights any time.</p>${btn(manage, "Add another flight")}`, `You are receiving this because you asked us to watch this flight. <a href="${manage}">Manage or stop your flight watch</a>.`),
    text: `${args.flightNumber} on ${args.date}: nothing to claim. Record: ${check}`,
  };
}

export function followupEmail(stage: 1 | 2 | 3, args: { token: string; name: string; flightNumber: string; date: string; airline: string; adrScheme: string; adrUrl: string; product: string }) {
  const report = `${SITE}/r/${args.token}`;
  const first = esc(args.name.split(" ")[0] || "there");
  if (stage === 1) {
    return {
      subject: `Did ${args.airline} reply to your ${args.flightNumber} claim?`,
      html: shell("Four weeks on: where is the claim?", `<p>Hi ${first}, it has been 28 days since your claim letter for ${esc(args.flightNumber)} on ${esc(args.date)} was ready. Airlines usually answer within this window.</p><ul style="line-height:1.6"><li><strong>Paid?</strong> Brilliant. <a href="${SITE}/api/outcome?token=${args.token}&outcome=paid">Tell us</a> and we will leave you alone.</li><li><strong>Refused citing extraordinary circumstances?</strong> ${args.product === "pack" ? `Your Claim Pack has the follow-up letter for exactly this; it is on your report page.` : `The follow-up letter that answers that defence is in the Claim Pack; you can upgrade for the difference on your report page.`}</li><li><strong>No reply at all?</strong> Send the letter again by a second route (their web form and email), and diary 8 weeks from your first send: that unlocks the free dispute scheme.</li></ul>${btn(report, "Open my report")}`, `You bought a claim letter from FlightDelayCheck. This is the first of three short reminders; reply STOP to end them.`),
      text: `28 days on: did ${args.airline} reply? Report: ${report}`,
    };
  }
  if (stage === 2) {
    return {
      subject: `8 weeks: you can now take ${args.airline} to ${args.adrScheme}, free`,
      html: shell("The escalation route is open", `<p>Hi ${first}, eight weeks have passed since your ${esc(args.flightNumber)} claim. If ${esc(args.airline)} has refused or gone quiet, you can now refer it to <strong>${esc(args.adrScheme)}</strong>. It costs you nothing, the airline pays the case fee, and the decision binds them.</p><p>You will need: your booking reference, the claim letter (on your report page), any reply from the airline, and the evidence appendix.</p>${btn(args.adrUrl, `Go to ${args.adrScheme}`)}${btn(report, "Open my report and evidence")}<p style="font-size:13px;color:#445266">Already paid? <a href="${SITE}/api/outcome?token=${args.token}&outcome=paid">Tell us</a>.</p>`, `You bought a claim letter from FlightDelayCheck. This is the second of three reminders; reply STOP to end them.`),
      text: `8 weeks on: escalate to ${args.adrScheme} (free): ${args.adrUrl}. Report: ${report}`,
    };
  }
  return {
    subject: `How did the ${args.flightNumber} claim end?`,
    html: shell("One question, and we go quiet", `<p>Hi ${first}, twelve weeks on from your ${esc(args.flightNumber)} claim, how did it end? One click and we stop emailing.</p><p><a href="${SITE}/api/outcome?token=${args.token}&outcome=paid">Paid in full</a> · <a href="${SITE}/api/outcome?token=${args.token}&outcome=partial">Paid something</a> · <a href="${SITE}/api/outcome?token=${args.token}&outcome=refused">Refused</a> · <a href="${SITE}/api/outcome?token=${args.token}&outcome=adr">With ${esc(args.adrScheme)}</a> · <a href="${SITE}/api/outcome?token=${args.token}&outcome=nothing">Never heard back</a></p><p style="font-size:14px;color:#445266">Your answer feeds the success rates we publish per airline, which helps the next passenger decide whether to bother.</p>`, `You bought a claim letter from FlightDelayCheck. This is the last reminder.`),
    text: `How did the ${args.flightNumber} claim end? Paid: ${SITE}/api/outcome?token=${args.token}&outcome=paid`,
  };
}
