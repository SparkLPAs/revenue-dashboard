"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { formatCurrency, formatDate, formatDateInput } from "@/lib/utils";
import { Trash2 } from "lucide-react";
export type PipelineLite = { id: string; name: string; hasProducts: boolean; active: boolean; revenueModel: string; dayRate: number | null; };
export type ProductLite = { id: string; name: string; price: number; pipelineId: string; };
export type EntryRow = { id: string; date: string; amount: number; label: string | null; leads: number; quantity: number; source: string; pipeline: { id: string; name: string; colour: string } | null; product: { id: string; name: string } | null; };
export function EntryManager({ pipelines, liveProducts, entries }: { pipelines: PipelineLite[]; liveProducts: ProductLite[]; entries: EntryRow[]; }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const today = formatDateInput(new Date());
  const directPipelines = pipelines.filter((p) => !p.hasProducts);
  const [manual, setManual] = useState({ pipelineId: directPipelines[0]?.id ?? pipelines[0]?.id ?? "", date: today, amount: "", label: "", leads: "" });
  const [sale, setSale] = useState({ productId: liveProducts[0]?.id ?? "", quantity: "1", date: today });
  const selectedProduct = liveProducts.find((p) => p.id === sale.productId);
  const computed = selectedProduct != null ? selectedProduct.price * (Number(sale.quantity) || 0) : 0;
  const dayRatePipelines = pipelines.filter((p) => p.revenueModel?.toLowerCase() === "day rate" || p.dayRate != null);
  const now = new Date();
  const monthStartStr = formatDateInput(new Date(now.getFullYear(), now.getMonth(), 1));
  const [wd, setWd] = useState(() => { const first = dayRatePipelines[0]; return { pipelineId: first?.id ?? "", rate: String(first?.dayRate ?? 375), region: "england-and-wales", start: monthStartStr, end: today }; });
  const [wdPreview, setWdPreview] = useState<null | { workingDays: number; holidaysExcluded: number; alreadyLogged: number; total: number; rate: number; holidaysUnavailable?: boolean; }>(null);
  const [wdMessage, setWdMessage] = useState("");
  const monthStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthToDate = entries.filter((e) => e.pipeline?.id === wd.pipelineId).filter((e) => { const d = new Date(e.date); return d >= monthStartDate && d <= now; }).reduce((sum, e) => sum + e.amount, 0);
  function setWdRange(start: string, end: string) { setWd((w) => ({ ...w, start, end })); setWdPreview(null); setWdMessage(""); }
  function quickThisMonth() { setWdRange(monthStartStr, today); }
  function quickLastMonth() { const lmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1); const lmEnd = new Date(now.getFullYear(), now.getMonth(), 0); setWdRange(formatDateInput(lmStart), formatDateInput(lmEnd)); }
  async function callWorkingDays(preview: boolean) {
    setBusy(true); setWdMessage("");
    const res = await fetch("/api/entries/working-days", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pipelineId: wd.pipelineId, rate: Number(wd.rate), region: wd.region, start: wd.start, end: wd.end, preview }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setWdMessage(data.error || "Something went wrong."); return; }
    if (preview) { setWdPreview(data); } else {
      setWdPreview(null);
      const extras = [data.alreadyLogged ? `${data.alreadyLogged} day(s) were already logged and skipped` : "", data.holidaysUnavailable ? "couldn\'t check bank holidays (no internet) — weekends were still skipped" : ""].filter(Boolean);
      setWdMessage(`✓ Logged ${data.created} working day(s) = ${formatCurrency(data.total)}.${extras.length ? " Note: " + extras.join("; ") + "." : ""}`);
      router.refresh();
    }
  }
  async function submitManual(e: React.FormEvent) {
    e.preventDefault(); if (!manual.pipelineId) return; setBusy(true);
    await fetch("/api/entries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pipelineId: manual.pipelineId, date: manual.date, amount: Number(manual.amount), label: manual.label || null, leads: Number(manual.leads) || 0 }) });
    setBusy(false); setManual({ ...manual, amount: "", label: "", leads: "" }); router.refresh();
  }
  async function submitSale(e: React.FormEvent) {
    e.preventDefault(); if (!selectedProduct) return; setBusy(true);
    await fetch("/api/entries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pipelineId: selectedProduct.pipelineId, productId: selectedProduct.id, quantity: Number(sale.quantity) || 1, date: sale.date }) });
    setBusy(false); setSale({ ...sale, quantity: "1" }); router.refresh();
  }
  async function remove(id: string) {
    if (!confirm("Delete this entry?")) return; setBusy(true);
    await fetch(`/api/entries/${id}`, { method: "DELETE" }); setBusy(false); router.refresh();
  }
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Log manual entry</CardTitle><p className="text-xs text-text-muted">Direct pipelines · date, amount, label, leads</p></CardHeader>
          <CardContent>
            <form onSubmit={submitManual} className="space-y-3">
              <div className="space-y-1"><Label>Pipeline</Label><Select value={manual.pipelineId} onChange={(e) => setManual({ ...manual, pipelineId: e.target.value })}>{(directPipelines.length ? directPipelines : pipelines).map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}</Select></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Date</Label><Input type="date" value={manual.date} onChange={(e) => setManual({ ...manual, date: e.target.value })} /></div>
                <div className="space-y-1"><Label>Amount (£)</Label><Input type="number" step="0.01" min="0" required value={manual.amount} onChange={(e) => setManual({ ...manual, amount: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Label</Label><Input value={manual.label} placeholder="Optional" onChange={(e) => setManual({ ...manual, label: e.target.value })} /></div>
                <div className="space-y-1"><Label>Lead count</Label><Input type="number" min="0" value={manual.leads} placeholder="0" onChange={(e) => setManual({ ...manual, leads: e.target.value })} /></div>
              </div>
              <Button type="submit" disabled={busy} className="w-full">Log entry</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Log product sale</CardTitle><p className="text-xs text-text-muted">Live products · auto-calculated from unit price</p></CardHeader>
          <CardContent>
            {liveProducts.length === 0 ? (<p className="text-xs text-text-muted">No live products yet. Set a Digital Downloads product to <span className="text-accent-digital">LIVE</span> to log sales.</p>) : (
              <form onSubmit={submitSale} className="space-y-3">
                <div className="space-y-1"><Label>Product</Label><Select value={sale.productId} onChange={(e) => setSale({ ...sale, productId: e.target.value })}>{liveProducts.map((p) => (<option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.price)}</option>))}</Select></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Quantity</Label><Input type="number" min="1" value={sale.quantity} onChange={(e) => setSale({ ...sale, quantity: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Date</Label><Input type="date" value={sale.date} onChange={(e) => setSale({ ...sale, date: e.target.value })} /></div>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2"><span className="text-xs text-text-muted">Total</span><span className="text-sm font-bold text-accent-digital">{formatCurrency(computed)}</span></div>
                <Button type="submit" variant="digital" disabled={busy} className="w-full">Log sale</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
      {dayRatePipelines.length > 0 && (
        <Card className="border-[#FDBA74]/40">
          <CardHeader><CardTitle>Log working days (day rate)</CardTitle><p className="text-xs text-text-muted">Auto-fills every Mon–Fri in the range, skipping weekends and UK bank holidays. Re-running the same dates won&apos;t double-count.</p></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1"><Label>Pipeline</Label><Select value={wd.pipelineId} onChange={(e) => { const p = dayRatePipelines.find((x) => x.id === e.target.value); setWd({ ...wd, pipelineId: e.target.value, rate: String(p?.dayRate ?? wd.rate) }); setWdPreview(null); setWdMessage(""); }}>{dayRatePipelines.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}</Select></div>
              <div className="space-y-1"><Label>Day rate (£)</Label><Input type="number" step="0.01" min="0" value={wd.rate} onChange={(e) => { setWd({ ...wd, rate: e.target.value }); setWdPreview(null); }} /></div>
              <div className="space-y-1"><Label>Bank holidays</Label><Select value={wd.region} onChange={(e) => { setWd({ ...wd, region: e.target.value }); setWdPreview(null); }}><option value="england-and-wales">England &amp; Wales</option><option value="scotland">Scotland</option><option value="northern-ireland">Northern Ireland</option></Select></div>
              <div className="space-y-1"><Label>Earned this month (to date)</Label><div className="flex h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-bold text-[#FDBA74]">{formatCurrency(monthToDate)}</div></div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:items-end">
              <div className="space-y-1"><Label>From</Label><Input type="date" max={today} value={wd.start} onChange={(e) => setWdRange(e.target.value, wd.end)} /></div>
              <div className="space-y-1"><Label>To</Label><Input type="date" max={today} value={wd.end} onChange={(e) => setWdRange(wd.start, e.target.value)} /></div>
              <div className="flex gap-2 sm:col-span-2"><Button type="button" variant="outline" size="sm" onClick={quickThisMonth}>This month</Button><Button type="button" variant="outline" size="sm" onClick={quickLastMonth}>Last month</Button></div>
            </div>
            {wdPreview && (<div className="rounded-md border border-[#FDBA74]/40 bg-[#FDBA74]/5 p-3 text-sm"><span className="font-bold">{wdPreview.workingDays}</span> working day(s) × <span className="font-bold">{formatCurrency(wdPreview.rate)}</span> = <span className="font-bold text-[#FDBA74]">{formatCurrency(wdPreview.total)}</span><span className="text-text-muted"> · {wdPreview.holidaysExcluded} bank holiday(s) skipped{wdPreview.alreadyLogged ? ` · ${wdPreview.alreadyLogged} already logged` : ""}{wdPreview.holidaysUnavailable ? " · ⚠ couldn\'t check bank holidays (no internet)" : ""}</span></div>)}
            {wdMessage && (<p className="text-xs text-accent">{wdMessage}</p>)}
            <div className="flex gap-2">
              <Button type="button" variant="outline" disabled={busy || !wd.pipelineId} onClick={() => callWorkingDays(true)}>Preview</Button>
              <Button type="button" disabled={busy || !wd.pipelineId} onClick={() => callWorkingDays(false)} className="bg-[#FDBA74] text-background hover:bg-[#FDBA74]/90 font-semibold">Log working days</Button>
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader><CardTitle>All entries</CardTitle><p className="text-xs text-text-muted">Sorted by date · newest first</p></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-y border-border text-left text-[10px] uppercase tracking-wider text-text-muted"><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Pipeline</th><th className="px-4 py-3 font-medium">Label</th><th className="px-4 py-3 font-medium">Source</th><th className="px-4 py-3 text-right font-medium">Leads</th><th className="px-4 py-3 text-right font-medium">Amount</th><th className="px-4 py-3" /></tr></thead>
            <tbody>
              {entries.length === 0 ? (<tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-text-muted">No entries yet. Log one above to get started.</td></tr>) : (
                entries.map((e) => (
                  <tr key={e.id} className="border-b border-border last:border-0 hover:bg-background/40">
                    <td className="whitespace-nowrap px-4 py-3 text-text-muted">{formatDate(e.date)}</td>
                    <td className="px-4 py-3"><span className="flex items-center gap-2"><span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: e.pipeline?.colour ?? "#8b949e" }} />{e.pipeline?.name ?? "—"}</span></td>
                    <td className="px-4 py-3 text-text-muted">{e.product?.name ?? e.label ?? "—"}</td>
                    <td className="px-4 py-3"><span className={e.source === "stripe" ? "rounded bg-accent-digital/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-accent-digital" : "rounded bg-border/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-text-muted"}>{e.source}</span></td>
                    <td className="px-4 py-3 text-right text-text-muted">{e.leads || "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(e.amount)}</td>
                    <td className="px-4 py-3 text-right"><Button size="icon" variant="ghost" onClick={() => remove(e.id)} aria-label="Delete"><Trash2 className="h-3.5 w-3.5 text-red-400" /></Button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}