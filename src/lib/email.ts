import { Resend } from "resend";

// Sends the customer their documents. FROM_EMAIL must be on a Resend-verified domain; until the
// site has its own domain this stays unset and delivery is on-screen only at /r/<token>.
export async function sendDocumentsEmail(args: { to: string; name: string; reportUrl: string; product: string }): Promise<{ sent: boolean; id?: string; reason?: string }> {
  const key = (process.env.RESEND_API_KEY || "").replace(/\\n$/, "").trim();
  const from = (process.env.FROM_EMAIL || "").trim();
  if (!key || !from) return { sent: false, reason: "email not configured" };
  const resend = new Resend(key);
  const subject = args.product === "pack" ? "Your flight compensation Claim Pack" : "Your flight compensation Claim Letter";
  const html = `<p>Hi ${escape(args.name.split(" ")[0] || "there")},</p>
<p>Your ${args.product === "pack" ? "Claim Pack" : "Claim Letter"} is ready. It is saved at the link below; keep it, you may need it if the airline replies.</p>
<p><a href="${args.reportUrl}">${args.reportUrl}</a></p>
<p>Send the letter to the airline's customer relations address or through their claim form (both are on your report page). They have 28 days. If they refuse or go quiet for 8 weeks, the escalation route on the same page is free to use.</p>
<p>You do not need to pay anyone a percentage of your compensation. If anything on the report looks wrong, reply to this email.</p>
<p>FlightDelayCheck</p>`;
  const res = await resend.emails.send({ from, to: args.to, subject, html });
  if (res.error) return { sent: false, reason: res.error.message };
  return { sent: true, id: res.data?.id };
}

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
