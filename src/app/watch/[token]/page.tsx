import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sbRpc } from "@/lib/supabase";
import WatchForm from "@/components/WatchForm";
import WatchList from "./WatchList";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your flight watch", robots: { index: false } };

export interface WatchRow { id: string; token: string; email: string; flight_number: string; flight_date: string; departure_iata: string | null; passengers: number; status: string; check_token: string | null; verdict: string | null; checked_at: string | null }

export default async function ManageWatch({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ confirm?: string; added?: string }> }) {
  const { token } = await params;
  const sp = await searchParams;
  if (sp.confirm) await sbRpc("fcc_confirm_watch", { p_token: token });
  const rows = await sbRpc<WatchRow>("fcc_get_watches", { p_token: token });
  if (!rows.length) notFound();
  const email = rows[0].email;
  const pending = rows.filter((r) => r.status === "pending").length;
  const upcoming = rows.filter((r) => r.status === "confirmed" || r.status === "pending");
  const done = rows.filter((r) => r.status === "checked" || r.status === "error");

  return (
    <div className="wrap" style={{ paddingTop: 36, paddingBottom: 40, maxWidth: 900 }}>
      <p className="eyebrow">Flight Watch · {email}</p>
      <h1 style={{ fontSize: "clamp(28px,4vw,40px)", marginTop: 8 }}>{sp.confirm ? "Confirmed. We are watching." : "Your watched flights"}</h1>
      {sp.added && <p className="small" style={{ background: "var(--go-soft)", color: "var(--go)", padding: "10px 14px", borderRadius: 6 }}>Added {sp.added} flight{sp.added === "1" ? "" : "s"}.{pending ? " Check your inbox to confirm the watch." : ""}</p>}
      {pending > 0 && !sp.confirm && <p className="small" style={{ background: "var(--warn-soft)", color: "var(--warn)", padding: "10px 14px", borderRadius: 6 }}>{pending} flight{pending === 1 ? " is" : "s are"} waiting for the confirmation click in your email.</p>}

      <WatchList token={token} upcoming={upcoming} done={done} />

      <section style={{ marginTop: 28 }}>
        <p className="eyebrow" style={{ marginBottom: 8 }}>Add more flights</p>
        <WatchForm token={token} email={email} compact />
      </section>
      <p className="small muted" style={{ marginTop: 22 }}>Bookmark this page; the link is in every email we send. <Link href="/">Check a past flight</Link> · <Link href="/your-rights">Your rights</Link></p>
    </div>
  );
}
