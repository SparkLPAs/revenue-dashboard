"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Pencil, Trash2, Plus, X, Check } from "lucide-react";
import type { ProductStat } from "@/lib/stats";
type Group = { group: string; products: ProductStat[] };
const STATUSES = [{ value: "live", label: "Live" }, { value: "coming_soon", label: "Coming soon" }, { value: "paused", label: "Paused" }];
export function ProductManager({ pipelineId, groups, knownGroups }: { pipelineId: string; groups: Group[]; knownGroups: string[]; }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", group: knownGroups[0] ?? "Startup Guides", price: "19.99", status: "coming_soon" });
  const [editDraft, setEditDraft] = useState({ name: "", group: "", price: "", status: "" });
  async function setStatus(id: string, status: string) { setBusy(true); await fetch(`/api/products/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); setBusy(false); router.refresh(); }
  async function saveEdit(id: string) { setBusy(true); await fetch(`/api/products/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editDraft.name, group: editDraft.group, price: Number(editDraft.price), status: editDraft.status }) }); setBusy(false); setEditing(null); router.refresh(); }
  async function remove(id: string) { if (!confirm("Delete this product?")) return; setBusy(true); await fetch(`/api/products/${id}`, { method: "DELETE" }); setBusy(false); router.refresh(); }
  async function addProduct(e: React.FormEvent) { e.preventDefault(); setBusy(true); await fetch(`/api/products`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pipelineId, name: draft.name, group: draft.group, price: Number(draft.price), status: draft.status }) }); setBusy(false); setAdding(false); setDraft({ name: "", group: knownGroups[0] ?? "Startup Guides", price: "19.99", status: "coming_soon" }); router.refresh(); }
  function startEdit(p: ProductStat) { setEditing(p.id); setEditDraft({ name: p.name, group: p.group, price: String(p.price), status: p.status }); }
  return (
    <div className="space-y-6">
      <div className="flex justify-end">{adding ? null : (<Button onClick={() => setAdding(true)} variant="digital" size="sm"><Plus className="h-3.5 w-3.5" /> Add product</Button>)}</div>
      {adding && (
        <Card className="border-accent-digital/40"><CardContent className="p-5">
          <form onSubmit={addProduct} className="grid grid-cols-1 gap-3 sm:grid-cols-5 sm:items-end">
            <div className="space-y-1 sm:col-span-2"><Label>Name</Label><Input required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Product name" /></div>
            <div className="space-y-1"><Label>Group</Label><Input list="dd-groups" value={draft.group} onChange={(e) => setDraft({ ...draft, group: e.target.value })} /><datalist id="dd-groups">{knownGroups.map((g) => (<option key={g} value={g} />))}</datalist></div>
            <div className="space-y-1"><Label>Price (£)</Label><Input type="number" step="0.01" min="0" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} /></div>
            <div className="space-y-1"><Label>Status</Label><Select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>{STATUSES.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}</Select></div>
            <div className="flex gap-2 sm:col-span-5"><Button type="submit" variant="digital" size="sm" disabled={busy}><Check className="h-3.5 w-3.5" /> Save</Button><Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}><X className="h-3.5 w-3.5" /> Cancel</Button></div>
          </form>
        </CardContent></Card>
      )}
      {groups.map((g) => (
        <div key={g.group}>
          <h3 className="mb-3 text-sm font-semibold tracking-tight text-accent-digital">{g.group}</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {g.products.map((p) => (
              <Card key={p.id}><CardContent className="p-4">
                {editing === p.id ? (
                  <div className="space-y-2">
                    <Input value={editDraft.name} onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input list="dd-groups" value={editDraft.group} onChange={(e) => setEditDraft({ ...editDraft, group: e.target.value })} />
                      <Input type="number" step="0.01" value={editDraft.price} onChange={(e) => setEditDraft({ ...editDraft, price: e.target.value })} />
                    </div>
                    <Select value={editDraft.status} onChange={(e) => setEditDraft({ ...editDraft, status: e.target.value })}>{STATUSES.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}</Select>
                    <div className="flex gap-2"><Button size="sm" variant="digital" disabled={busy} onClick={() => saveEdit(p.id)}><Check className="h-3.5 w-3.5" /> Save</Button><Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X className="h-3.5 w-3.5" /> Cancel</Button></div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2"><span className="text-sm font-semibold leading-tight">{p.name}</span><StatusBadge status={p.status} /></div>
                    <div className="mt-1 text-xs text-text-muted">{formatCurrency(p.price)}</div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      {[["Total", formatCurrency(p.total)], ["Month", formatCurrency(p.month)], ["Units", String(p.units)]].map(([label, value]) => (
                        <div key={label} className="rounded-md border border-border bg-background px-2 py-1.5"><div className="text-[10px] uppercase tracking-wider text-text-muted">{label}</div><div className="text-xs font-semibold">{value}</div></div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <Select className="h-7 text-xs" value={p.status} disabled={busy} onChange={(e) => setStatus(p.id, e.target.value)}>{STATUSES.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}</Select>
                      <div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => startEdit(p)} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></Button><Button size="icon" variant="ghost" onClick={() => remove(p.id)} aria-label="Delete"><Trash2 className="h-3.5 w-3.5 text-red-400" /></Button></div>
                    </div>
                  </>
                )}
              </CardContent></Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}