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
  const monthStart = startOfMonth();

  const entries = await prisma.revenueEntry.findMany({
    where: pipelineId ? { pipelineId } : undefined,
    select: { amount: true, date: true },
  });

  let toDate = 0;
  let thisMonth = 0;
  for (const e of entries) {
    toDate += e.amount;
    if (e.date >= monthStart) thisMonth += e.amount;
  }

  return NextResponse.json({ thisMonth, toDate });
}
