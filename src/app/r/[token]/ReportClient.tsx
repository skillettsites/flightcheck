"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ReportClient({ token, letter, mode = "wait" }: { token: string; letter?: string; mode?: "wait" | "tools" }) {
  const router = useRouter();
  const [status, setStatus] = useState("checking");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (mode !== "wait") return;
    let stop = false;
    let n = 0;
    const tick = async () => {
      n++;
      try {
        const res = await fetch(`/api/purchase-status?token=${encodeURIComponent(token)}`, { cache: "no-store" });
        const d = await res.json();
        if (stop) return;
        setStatus(d.status || "pending");
        if (d.status === "ready") { router.refresh(); return; }
      } catch { /* retry */ }
      if (!stop && n < 40) setTimeout(tick, 2500);
    };
    tick();
    return () => { stop = true; };
  }, [token, mode, router]);

  if (mode === "tools") {
    return (
      <>
        <button className="btn btn-primary" type="button" onClick={async () => { if (letter) { await navigator.clipboard.writeText(letter); setCopied(true); setTimeout(() => setCopied(false), 2000); } }}>{copied ? "Copied" : "Copy letter"}</button>
        <button className="btn btn-ghost" type="button" onClick={() => window.print()}>Print or save as PDF</button>
      </>
    );
  }

  return (
    <div className="card" style={{ textAlign: "center", padding: 36 }}>
      <p className="eyebrow">Order {token}</p>
      <h1 style={{ fontSize: 30, marginTop: 8 }}>{status === "awaiting_payment" ? "Waiting for payment confirmation" : "Writing your letter from the flight record"}</h1>
      <p className="muted" style={{ marginTop: 10 }}>{status === "awaiting_payment" ? "If you closed the payment window, go back and complete it. Nothing is charged until Stripe confirms." : "This takes 10 to 20 seconds. The page will update by itself."}</p>
      <div aria-hidden style={{ margin: "18px auto 0", width: 160, height: 6, borderRadius: 3, background: "var(--paper-3)", overflow: "hidden" }}>
        <div style={{ width: "40%", height: "100%", background: "var(--accent)", animation: "slide 1.2s ease-in-out infinite alternate" }} />
      </div>
      <style>{`@keyframes slide { from { transform: translateX(-60%);} to { transform: translateX(260%);} } @media (prefers-reduced-motion: reduce) { div[aria-hidden] div { animation: none; } }`}</style>
    </div>
  );
}
