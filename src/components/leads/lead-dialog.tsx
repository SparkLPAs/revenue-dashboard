"use client";

import { useState } from "react";
import { X, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import type { Lead, Stage, UserOption } from "./types";

type Props = {
  pipelineId: string;
  stages: Stage[];
  users: UserOption[];
  currentUser: { id: string; role: "ADMIN" | "STAFF" };
  lead?: Lead;
  defaultStageId?: string;
  onClose: () => void;
  onSaved: (lead: Lead) => void;
  onDeleted?: (id: string) => void;
};

export function LeadDialog({ pipelineId, stages, users, currentUser, lead, defaultStageId, onClose, onSaved, onDeleted }: Props) {
  const isEdit = Boolean(lead);
  const [name, setName] = useState(lead?.name ?? "");
  const [company, setCompany] = useState(lead?.company ?? "");
  const [email, setEmail] = useState(lead?.email ?? "");
  const [phone, setPhone] = useState(lead?.phone ?? "");
  const [expectedValue, setExpectedValue] = useState(lead?.expectedValue?.toString() ?? "");
  const [source, setSource] = useState(lead?.source ?? "");
  const [ownerId, setOwnerId] = useState(lead?.owner?.id ?? currentUser.id);
  const [stageId, setStageId] = useState(lead?.stageId ?? defaultStageId ?? stages[0]?.id ?? "");
  const [nextActionAt, setNextActionAt] = useState(lead?.nextActionAt ? lead.nextActionAt.slice(0, 10) : "");
  const [nextActionNote, setNextActionNote] = useState(lead?.nextActionNote ?? "");
  const [notes, setNotes] = useState(lead?.notes ?? "");
  const [noteBody, setNoteBody] = useState("");
  const [activity, setActivity] = useState(lead?.activity ?? []);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const payload = {
      pipelineId,
      stageId,
      ownerId,
      name,
      company,
      email,
      phone,
      expectedValue: expectedValue === "" ? null : Number(expectedValue),
      source,
      notes,
      nextActionAt: nextActionAt || null,
      nextActionNote,
    };
    try {
      const res = await fetch(isEdit ? `/api/leads/${lead!.id}` : "/api/leads", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Save failed.");
        return;
      }
      const saved = await res.json();
      onSaved(saved);
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddNote() {
    if (!noteBody.trim() || !lead) return;
    const res = await fetch(`/api/leads/${lead.id}/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: noteBody }),
    });
    if (res.ok) {
      const created = await res.json();
      setActivity((prev) => [created, ...prev]);
      setNoteBody("");
    }
  }

  async function handleDelete() {
    if (!lead || !onDeleted) return;
    if (!confirm(`Delete lead "${lead.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
    if (res.ok) onDeleted(lead.id);
  }

  const canDelete = Boolean(lead);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
      <div className="flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-sm font-semibold tracking-tight">{isEdit ? "Edit Lead" : "New Lead"}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 space-y-4 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Contact or deal name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="company">Company</Label>
              <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expectedValue">Expected value (£)</Label>
              <Input id="expectedValue" type="number" min="0" step="0.01" value={expectedValue} onChange={(e) => setExpectedValue(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="stage">Stage</Label>
              <Select id="stage" value={stageId} onChange={(e) => setStageId(e.target.value)}>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="owner">Owner</Label>
              <Select id="owner" value={ownerId} onChange={(e) => setOwnerId(e.target.value)} disabled={currentUser.role !== "ADMIN"}>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="source">Source</Label>
            <Input id="source" value={source} onChange={(e) => setSource(e.target.value)} placeholder="Referral, LinkedIn, website…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nextActionAt">Follow-up due</Label>
              <Input id="nextActionAt" type="date" value={nextActionAt} onChange={(e) => setNextActionAt(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nextActionNote">Follow-up action</Label>
              <Input id="nextActionNote" value={nextActionNote} onChange={(e) => setNextActionNote(e.target.value)} placeholder="Call back, send proposal…" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          {lead?.revenueEntryId && (
            <p className="rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-accent">
              Won — {formatCurrency(lead.expectedValue ?? 0)} logged to Revenue Entries.
            </p>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex items-center gap-2 pt-2">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create lead"}
            </Button>
            {canDelete && (
              <Button type="button" variant="destructive" size="icon" onClick={handleDelete}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </form>

        {isEdit && (
          <div className="border-t border-border p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Activity</h3>
            <div className="mb-3 flex gap-2">
              <Textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                placeholder="Add a note…"
                className="min-h-[60px]"
              />
            </div>
            <Button type="button" size="sm" variant="outline" onClick={handleAddNote} disabled={!noteBody.trim()}>
              Add note
            </Button>
            <ul className="mt-4 space-y-3">
              {activity.map((a) => (
                <li key={a.id} className="border-l-2 border-border pl-3 text-xs">
                  <p className="text-text-primary">{a.body}</p>
                  <p className="mt-1 text-[10px] text-text-muted">
                    {a.author?.name ?? "Unknown"} · {new Date(a.createdAt).toLocaleString("en-GB")}
                  </p>
                </li>
              ))}
              {activity.length === 0 && <p className="text-xs text-text-muted">No activity yet.</p>}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
