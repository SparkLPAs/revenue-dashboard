import { prisma } from "@/lib/db";

export const DEFAULT_STAGES = [
  { name: "Lead Inbound", sortOrder: 1, isWon: false, isLost: false },
  { name: "Invoice Sent", sortOrder: 2, isWon: false, isLost: false },
  { name: "Invoice Paid", sortOrder: 3, isWon: true, isLost: false },
  { name: "Lost", sortOrder: 4, isWon: false, isLost: true },
];

// Self-healing: called wherever stages for a pipeline are read or a lead is
// created, so a fresh database (no seed script run) never blocks the UI --
// it just creates the defaults the first time they're needed.
export async function ensureDefaultStages(pipelineId: string) {
  const existing = await prisma.stage.count({ where: { pipelineId } });
  if (existing > 0) return;

  await prisma.stage.createMany({
    data: DEFAULT_STAGES.map((s) => ({ pipelineId, ...s })),
    skipDuplicates: true,
  });
}
