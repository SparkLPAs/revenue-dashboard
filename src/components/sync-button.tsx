"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
export function SyncButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  async function sync() {
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/sync/stripe", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { setMsg(data.imported > 0 ? `${data.imported} new payment(s) imported.` : "Up to date — no new payments."); router.refresh(); }
      else { setMsg(data.error || "Sync failed."); }
    } catch { setMsg("Sync failed."); }
    setBusy(false);
  }
  return (
    <div className="flex items-center gap-3">
      {msg && <span className="text-xs text-text-muted">{msg}</span>}
      <Button variant="outline" size="sm" onClick={sync} disabled={busy}>
        <RefreshCw className={busy ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
        {busy ? "Syncing…" : "Sync Stripe"}
      </Button>
    </div>
  );
}
