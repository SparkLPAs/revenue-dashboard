"use client";

import { AlertCircle, Building2, PoundSterling } from "lucide-react";

import { formatCurrency } from "@/lib/utils";
import type { Lead } from "./types";

function isOverdue(nextActionAt: string | null) {
  if (!nextActionAt) return false;
  return new Date(nextActionAt).getTime() < Date.now();
}

export function LeadCard({
  lead,
  onOpen,
  onDragStart,
}: {
  lead: Lead;
  onOpen: () => void;
  onDragStart: (e: React.DragEvent) => void;
}) {
  const overdue = isOverdue(lead.nextActionAt);

  return (
    <button
      draggable
      onDragStart={onDragStart}
      onClick={onOpen}
      className="w-full cursor-grab rounded-md border border-border bg-background p-3 text-left transition-colors hover:border-accent/50 active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold leading-snug">{lead.name}</span>
        {overdue && <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />}
      </div>
      {lead.company && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-text-muted">
          <Building2 className="h-3 w-3" />
          {lead.company}
        </div>
      )}
      {lead.expectedValue != null && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-text-muted">
          <PoundSterling className="h-3 w-3" />
          {formatCurrency(lead.expectedValue)}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-text-muted">
          {lead.owner?.name ?? "Unassigned"}
        </span>
        {lead.nextActionAt && (
          <span className={overdue ? "text-[10px] font-semibold text-red-400" : "text-[10px] text-text-muted"}>
            {new Date(lead.nextActionAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </span>
        )}
      </div>
    </button>
  );
}
