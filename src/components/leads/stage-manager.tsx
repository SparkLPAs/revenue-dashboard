"use client";

import { useState } from "react";
import { ArrowUp, ArrowDown, Trash2, X, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { Stage } from "./types";

export function StageManager({
  pipelineId,
  stages,
  onClose,
  onChanged,
}: {
  pipelineId: string;
  stages: Stage[];
  onClose: () => void;
  onChanged: (stages: Stage[]) => void;
}) {
  const [list, setList] = useState([...stages].sort((a, b) => a.sortOrder - b.sortOrder));
  const [newName, setNewName] = useState("");
  const [newIsWon, setNewIsWon] = useState(false);
  const [newIsLost, setNewIsLost] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function patchStage(id: string, data: Record<string, unknown>) {
    const res = await fetch(`/api/stages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.ok ? res.json() : null;
  }

  async function rename(stage: Stage, name: string) {
    if (!name.trim() || name === stage.name) return;
    const updated = await patchStage(stage.id, { name: name.trim() });
    if (updated) {
      const next = list.map((s) => (s.id === stage.id ? updated : s));
      setList(next);
      onChanged(next);
    }
  }

  async function toggle(stage: Stage, field: "isWon" | "isLost") {
    const updated = await patchStage(stage.id, { [field]: !stage[field] });
    if (updated) {
      const next = list.map((s) => (s.id === stage.id ? updated : s));
      setList(next);
      onChanged(next);
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const a = list[index];
    const b = list[target];
    const [updatedA, updatedB] = await Promise.all([
      patchStage(a.id, { sortOrder: b.sortOrder }),
      patchStage(b.id, { sortOrder: a.sortOrder }),
    ]);
    if (updatedA && updatedB) {
      const next = [...list];
      next[index] = updatedB;
      next[target] = updatedA;
      const sorted = next.sort((x, y) => x.sortOrder - y.sortOrder);
      setList(sorted);
      onChanged(sorted);
    }
  }

  async function remove(stage: Stage) {
    if (!confirm(`Delete stage "${stage.name}"?`)) return;
    const res = await fetch(`/api/stages/${stage.id}`, { method: "DELETE" });
    if (res.ok) {
      const next = list.filter((s) => s.id !== stage.id);
      setList(next);
      onChanged(next);
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to delete stage.");
    }
  }

  async function addStage(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipelineId, name: newName, isWon: newIsWon, isLost: newIsLost }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to add stage.");
        return;
      }
      const created = await res.json();
      const next = [...list, created];
      setList(next);
      onChanged(next);
      setNewName(""); setNewIsWon(false); setNewIsLost(false);
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
      <div className="flex h-full w-full max-w-sm flex-col overflow-y-auto border-l border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-sm font-semibold tracking-tight">Manage Stages</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-2 p-4">
          {list.map((stage, i) => (
            <div key={stage.id} className="rounded-md border border-border bg-background p-2.5">
              <div className="flex items-center gap-2">
                <input
                  defaultValue={stage.name}
                  onBlur={(e) => rename(stage, e.target.value)}
                  className="flex-1 rounded bg-transparent px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <button onClick={() => move(i, -1)} disabled={i === 0} className="text-text-muted hover:text-text-primary disabled:opacity-30">
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => move(i, 1)} disabled={i === list.length - 1} className="text-text-muted hover:text-text-primary disabled:opacity-30">
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => remove(stage)} className="text-text-muted hover:text-red-400">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-2 flex gap-3 pl-1 text-[10px]">
                <label className="flex items-center gap-1.5 text-text-muted">
                  <input type="checkbox" checked={stage.isWon} onChange={() => toggle(stage, "isWon")} />
                  Marks lead as Won
                </label>
                <label className="flex items-center gap-1.5 text-text-muted">
                  <input type="checkbox" checked={stage.isLost} onChange={() => toggle(stage, "isLost")} />
                  Marks lead as Lost
                </label>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={addStage} className="space-y-3 border-t border-border p-4">
          <Label htmlFor="new-stage-name">Add a stage</Label>
          <Input id="new-stage-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Stage name" required />
          <div className="flex gap-3 text-xs text-text-muted">
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={newIsWon} onChange={(e) => setNewIsWon(e.target.checked)} />
              Won stage
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={newIsLost} onChange={(e) => setNewIsLost(e.target.checked)} />
              Lost stage
            </label>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <Button type="submit" size="sm" disabled={saving} className="w-full">
            <Plus className="h-3.5 w-3.5" />
            {saving ? "Adding…" : "Add stage"}
          </Button>
        </form>
      </div>
    </div>
  );
}
