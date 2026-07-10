import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { startOfMonth } from "@/lib/stats";

export const runtime = "nodejs";

// Aggregate-only endpoint (no line-item detail) so staff can see pipeline
// totals on the Leads page without being granted access to /api/entries.
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const pipelineId = searchParams.get("pipelineId") ?? undefined;
  const pipelineIds = searchParams.get("pipelineIds")?.split(",").filter(Boolean);
  const monthStart = startOfMonth();
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const where = pipelineId ? { pipelineId } : pipelineIds ? { pipelineId: { in: pipelineIds } } : undefined;

  const entries = await prisma.revenueEntry.findMany({
    where,
    select: { amount: true, date: true },
  });

  let toDate = 0;
  let thisMonth = 0;
  for (const e of entries) {
    // Match the main dashboard's rule: ignore entries dated in the future.
    if (e.date > todayEnd) continue;
    toDate += e.amount;
    if (e.date >= monthStart) thisMonth += e.amount;
  }

  return NextResponse.json({ thisMonth, toDate });
}
