"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { LeadCard } from "./lead-card";
import { LeadDialog } from "./lead-dialog";
import { StageManager } from "./stage-manager";
import type { Lead, PipelineOption, Stage, UserOption } from "./types";

const ALL_PIPELINES = "__all__";

export function LeadsBoard({
  pipelines,
  users,
  currentUser,
}: {
  pipelines: PipelineOption[];
  users: UserOption[];
  currentUser: { id: string; name: string; role: "ADMIN" | "STAFF" };
}) {
  const defaultPipeline = pipelines.find((p) => p.id === "spark-works") ?? pipelines[0];
  const [pipelineId, setPipelineId] = useState(defaultPipeline?.id ?? "");
  const [stages, setStages] = useState<Stage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogLead, setDialogLead] = useState<Lead | undefined | "new">(undefined);
  const [dialogStages, setDialogStages] = useState<Stage[]>([]);
  const [dragStageId, setDragStageId] = useState<string | null>(null);
  const [managingStages, setManagingStages] = useState(false);

  const isAll = pipelineId === ALL_PIPELINES;

  useEffect(() => {
    if (!pipelineId) return;
    setLoading(true);
    if (isAll) {
      fetch(`/api/leads`)
        .then((r) => r.json())
        .then((leadsData) => {
          setStages([]);
          setLeads(Array.isArray(leadsData) ? leadsData : []);
        })
        .finally(() => setLoading(false));
      return;
    }
    Promise.all([
      fetch(`/api/stages?pipelineId=${pipelineId}`).then((r) => r.json()),
      fetch(`/api/leads?pipelineId=${pipelineId}`).then((r) => r.json()),
    ])
      .then(([stagesData, leadsData]) => {
        setStages(Array.isArray(stagesData) ? stagesData : []);
        setLeads(Array.isArray(leadsData) ? leadsData : []);
      })
      .finally(() => setLoading(false));
  }, [pipelineId, isAll]);

  async function openLead(lead: Lead) {
    if (isAll) {
      const res = await fetch(`/api/stages?pipelineId=${lead.pipelineId}`);
      const data = await res.json().catch(() => []);
      setDialogStages(Array.isArray(data) ? data : []);
    } else {
      setDialogStages(stages);
    }
    setDialogLead(lead);
  }

  const leadsByStage = useMemo(() => {
    const map = new Map<string, Lead[]>();
    for (const lead of leads) {
      const arr = map.get(lead.stageId) ?? [];
      arr.push(lead);
      map.set(lead.stageId, arr);
    }
    return map;
  }, [leads]);

  const leadsByPipeline = useMemo(() => {
    const map = new Map<string, Lead[]>();
    for (const lead of leads) {
      const arr = map.get(lead.pipelineId) ?? [];
      arr.push(lead);
      map.set(lead.pipelineId, arr);
    }
    return map;
  }, [leads]);

  const openTotal = useMemo(
    () =>
      leads
        .filter((l) => !l.stage.isWon && !l.stage.isLost)
        .reduce((sum, l) => sum + (l.expectedValue ?? 0), 0),
    [leads]
  );

  const wonTotal = useMemo(
    () => leads.filter((l) => l.stage.isWon).reduce((sum, l) => sum + (l.expectedValue ?? 0), 0),
    [leads]
  );

  const openCount = useMemo(() => leads.filter((l) => !l.stage.isLost).length, [leads]);

  function upsertLead(saved: Lead) {
    setLeads((prev) => {
      const exists = prev.some((l) => l.id === saved.id);
      return exists ? prev.map((l) => (l.id === saved.id ? saved : l)) : [saved, ...prev];
    });
    setDialogLead(undefined);
  }

  function removeLead(id: string) {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setDialogLead(undefined);
  }

  async function moveLead(leadId: string, stageId: string) {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.stageId === stageId) return;
    // optimistic update
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stageId } : l)));
    const res = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageId }),
    });
    if (res.ok) {
      const updated = await res.json();
      setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
    } else {
      // revert on failure
      setLeads((prev) => prev.map((l) => (l.id === leadId ? lead : l)));
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4">
          <div className="text-xs uppercase tracking-wider text-text-muted">Leads</div>
          <div className="mt-1 text-xl font-bold tracking-tight">{openCount}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs uppercase tracking-wider text-text-muted">Open Pipeline Value</div>
          <div className="mt-1 text-xl font-bold tracking-tight">{formatCurrency(openTotal)}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs uppercase tracking-wider text-text-muted">Won Value</div>
          <div className="mt-1 text-xl font-bold tracking-tight">{formatCurrency(wonTotal)}</div>
        </CardContent></Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Select value={pipelineId} onChange={(e) => setPipelineId(e.target.value)} className="w-56">
            <option value={ALL_PIPELINES}>All Pipelines</option>
            {pipelines.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-2">
          {!isAll && currentUser.role === "ADMIN" && (
            <Button size="sm" variant="outline" onClick={() => setManagingStages(true)}>
              <Settings2 className="h-3.5 w-3.5" />
              Manage Stages
            </Button>
          )}
          {!isAll && (
            <Button size="sm" onClick={() => { setDialogStages(stages); setDialogLead("new"); }}>
              <Plus className="h-3.5 w-3.5" />
              New Lead
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-text-muted">Loading…</p>
      ) : isAll ? (
        <div className="space-y-6">
          {pipelines.map((p) => {
            const pipelineLeads = leadsByPipeline.get(p.id) ?? [];
            if (pipelineLeads.length === 0) return null;
            const pipelineTotal = pipelineLeads.reduce((sum, l) => sum + (l.expectedValue ?? 0), 0);
            return (
              <div key={p.id}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.colour }} />
                  <h3 className="text-xs font-semibold uppercase tracking-wider">{p.name}</h3>
                  <span className="text-[10px] text-text-muted">{pipelineLeads.length} · {formatCurrency(pipelineTotal)}</span>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {pipelineLeads.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} onOpen={() => openLead(lead)} onDragStart={() => {}} />
                  ))}
                </div>
              </div>
            );
          })}
          {leads.length === 0 && <p className="text-xs text-text-muted">No leads yet.</p>}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {stages.map((stage) => {
            const stageLeads = leadsByStage.get(stage.id) ?? [];
            const stageTotal = stageLeads.reduce((sum, l) => sum + (l.expectedValue ?? 0), 0);
            return (
              <div
                key={stage.id}
                onDragOver={(e) => { e.preventDefault(); setDragStageId(stage.id); }}
                onDragLeave={() => setDragStageId((s) => (s === stage.id ? null : s))}
                onDrop={(e) => {
                  e.preventDefault();
                  const leadId = e.dataTransfer.getData("text/lead-id");
                  if (leadId) moveLead(leadId, stage.id);
                  setDragStageId(null);
                }}
                className={`min-h-[200px] w-64 shrink-0 rounded-lg border p-3 transition-colors ${
                  dragStageId === stage.id ? "border-accent bg-accent/5" : "border-border bg-card"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider">
                      {stage.name}
                      {stage.isWon && <span className="ml-1 text-accent">●</span>}
                      {stage.isLost && <span className="ml-1 text-red-400">●</span>}
                    </h3>
                    <p className="text-[10px] text-text-muted">{stageLeads.length} · {formatCurrency(stageTotal)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {stageLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onOpen={() => openLead(lead)}
                      onDragStart={(e) => e.dataTransfer.setData("text/lead-id", lead.id)}
                    />
                  ))}
                  {stageLeads.length === 0 && (
                    <p className="py-6 text-center text-[11px] text-text-muted">No leads</p>
                  )}
                </div>
              </div>
            );
          })}
          {stages.length === 0 && <p className="text-xs text-text-muted">Loading stages…</p>}
        </div>
      )}

      {dialogLead !== undefined && (
        <LeadDialog
          pipelineId={dialogLead && dialogLead !== "new" ? dialogLead.pipelineId : pipelineId}
          stages={dialogStages}
          users={users}
          currentUser={currentUser}
          lead={dialogLead === "new" ? undefined : dialogLead}
          onClose={() => setDialogLead(undefined)}
          onSaved={upsertLead}
          onDeleted={removeLead}
        />
      )}

      {managingStages && (
        <StageManager
          pipelineId={pipelineId}
          stages={stages}
          onClose={() => setManagingStages(false)}
          onChanged={setStages}
        />
      )}
    </div>
  );
}
