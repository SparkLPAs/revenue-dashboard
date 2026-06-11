import * as React from "react";
import { cn } from "@/lib/utils";
type Status = "live" | "coming_soon" | "paused";
const styles: Record<Status, string> = { live: "border-green-500/40 bg-green-500/10 text-green-400", coming_soon: "border-yellow-500/40 bg-yellow-500/10 text-yellow-400", paused: "border-gray-500/40 bg-gray-500/10 text-gray-400" };
const labels: Record<Status, string> = { live: "LIVE", coming_soon: "COMING SOON", paused: "PAUSED" };
export function StatusBadge({ status }: { status: string }) {
  const key = (status as Status) in styles ? (status as Status) : "coming_soon";
  return (<span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wider", styles[key])}>{labels[key]}</span>);
}
