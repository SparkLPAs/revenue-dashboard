import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const pipelineId = searchParams.get("pipelineId") ?? undefined;

  const stages = await prisma.stage.findMany({
    where: pipelineId ? { pipelineId } : undefined,
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(stages);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body || !body.pipelineId || !body.name) {
    return NextResponse.json({ error: "pipelineId and name are required" }, { status: 400 });
  }

  const max = await prisma.stage.aggregate({
    where: { pipelineId: body.pipelineId },
    _max: { sortOrder: true },
  });

  const stage = await prisma.stage.create({
    data: {
      pipelineId: body.pipelineId,
      name: body.name,
      sortOrder: (max._max.sortOrder ?? 0) + 1,
      isWon: Boolean(body.isWon),
      isLost: Boolean(body.isLost),
    },
  });
  return NextResponse.json(stage, { status: 201 });
}
