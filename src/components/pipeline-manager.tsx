"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Pencil, Trash2, Plus, X, Check, Pause, Play } from "lucide-react";
export type Pipeline = { id: string; name: string; category: string; paymentRoute: string; revenueModel: string; colour: string; active: boolean; hasProducts: boolean; };
const ROUTES = ["Stripe", "Direct"];
const emptyDraft = { name: "", category: "", paymentRoute: "Direct", revenueModel: "", colour: "#6EE7B7", hasProducts: false };
export function PipelineManager({ pipelines }: { pipelines: Pipeline[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ ...emptyDraft });
  const [editDraft, setEditDraft] = useState<Pipeline | null>(null);
  async function add(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    await fetch("/api/pipelines", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
    setBusy(false); setAdding(false); setDraft({ ...emptyDraft }); router.refresh();
  }
  async function saveEdit() {
    if (!editDraft) return; setBusy(true);
    await fetch(`/api/pipelines/${editDraft.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editDraft.name, category: editDraft.category, paymentRoute: editDraft.paymentRoute, revenueModel: editDraft.revenueModel, colour: editDraft.colour, hasProducts: editDraft.hasProducts }) });
    setBusy(false); setEditing(null); setEditDraft(null); router.refresh();
  }
  async function toggleActive(p: Pipeline) {
    setBusy(true);
    await fetch(`/api/pipelines/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !p.active }) });
    setBusy(false); router.refresh();
  }
  async function remove(p: Pipeline) {
    if (!confirm(`Delete "${p.name}"? This also removes its entries${p.hasProducts ? " and products" : ""}.`)) return;
    setBusy(true); await fetch(`/api/pipelines/${p.id}`, { method: "DELETE" }); setBusy(false); router.refresh();
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-end">{!adding && (<Button onClick={() => setAdding(true)} size="sm"><Plus className="h-3.5 w-3.5" /> Add pipeline</Button>)}</div>
      {adding && (
        <Card className="border-accent/40"><CardContent className="p-5">
          <form onSubmit={add} className="grid grid-cols-1 gap-3 sm:grid-cols-6 sm:items-end">
            <div className="space-y-1 sm:col-span-2"><Label>Name</Label><Input required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
            <div className="space-y-1"><Label>Category</Label><Input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} /></div>
            <div className="space-y-1"><Label>Route</Label><Select value={draft.paymentRoute} onChange={(e) => setDraft({ ...draft, paymentRoute: e.target.value })}>{ROUTES.map((r) => (<option key={r} value={r}>{r}</option>))}</Select></div>
            <div className="space-y-1"><Label>Model</Label><Input value={draft.revenueModel} onChange={(e) => setDraft({ ...draft, revenueModel: e.target.value })} /></div>
            <div className="space-y-1"><Label>Colour</Label><input type="color" className="h-9 w-full rounded-md border border-border bg-background" value={draft.colour} onChange={(e) => setDraft({ ...draft, colour: e.target.value })} /></div>
            <label className="flex items-center gap-2 text-xs text-text-muted sm:col-span-2"><input type="checkbox" checked={draft.hasProducts} onChange={(e) => setDraft({ ...draft, hasProducts: e.target.checked })} />Has products</label>
            <div className="flex gap-2 sm:col-span-4 sm:justify-end"><Button type="submit" size="sm" disabled={busy}><Check className="h-3.5 w-3.5" /> Save</Button><Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}><X className="h-3.5 w-3.5" /> Cancel</Button></div>
          </form>
        </CardContent></Card>
      )}
      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-[10px] uppercase tracking-wider text-text-muted"><th className="px-4 py-3 font-medium">Pipeline</th><th className="px-4 py-3 font-medium">Category</th><th className="px-4 py-3 font-medium">Route</th><th className="px-4 py-3 font-medium">Model</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr></thead>
          <tbody>
            {pipelines.map((p) => editing === p.id && editDraft ? (
              <tr key={p.id} className="border-b border-border bg-background/40">
                <td className="px-4 py-2"><Input value={editDraft.name} onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })} /></td>
                <td className="px-4 py-2"><Input value={editDraft.category} onChange={(e) => setEditDraft({ ...editDraft, category: e.target.value })} /></td>
                <td className="px-4 py-2"><Select value={editDraft.paymentRoute} onChange={(e) => setEditDraft({ ...editDraft, paymentRoute: e.target.value })}>{ROUTES.map((r) => (<option key={r} value={r}>{r}</option>))}</Select></td>
                <td className="px-4 py-2"><Input value={editDraft.revenueModel} onChange={(e) => setEditDraft({ ...editDraft, revenueModel: e.target.value })} /></td>
                <td className="px-4 py-2"><input type="color" className="h-8 w-10 rounded border border-border bg-background" value={editDraft.colour} onChange={(e) => setEditDraft({ ...editDraft, colour: e.target.value })} /></td>
                <td className="px-4 py-2"><div className="flex justify-end gap-1"><Button size="icon" variant="ghost" disabled={busy} onClick={saveEdit} aria-label="Save"><Check className="h-3.5 w-3.5 text-accent" /></Button><Button size="icon" variant="ghost" onClick={() => { setEditing(null); setEditDraft(null); }} aria-label="Cancel"><X className="h-3.5 w-3.5" /></Button></div></td>
              </tr>
            ) : (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-background/40">
                <td className="px-4 py-3"><div className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.colour }} /><span className="font-semibold">{p.name}</span>{p.hasProducts && (<span className="rounded bg-accent-digital/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-accent-digital">Products</span>)}</div></td>
                <td className="px-4 py-3 text-text-muted">{p.category}</td>
                <td className="px-4 py-3 text-text-muted">{p.paymentRoute}</td>
                <td className="px-4 py-3 text-text-muted">{p.revenueModel}</td>
                <td className="px-4 py-3"><span className={p.active ? "rounded-full border border-green-500/40 bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-400" : "rounded-full border border-gray-500/40 bg-gray-500/10 px-2 py-0.5 text-[10px] font-semibold text-gray-400"}>{p.active ? "ACTIVE" : "PAUSED"}</span></td>
                <td className="px-4 py-3"><div className="flex justify-end gap-1">
                  <Button size="icon" variant="ghost" disabled={busy} onClick={() => toggleActive(p)} aria-label={p.active ? "Pause" : "Resume"}>{p.active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 text-accent" />}</Button>
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(p.id); setEditDraft(p); }} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(p)} aria-label="Delete"><Trash2 className="h-3.5 w-3.5 text-red-400" /></Button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>
    </div>
  );
}