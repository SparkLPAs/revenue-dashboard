import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ensureDefaultStages } from "@/lib/stages";

export const runtime = "nodejs";

const leadInclude = {
  pipeline: { select: { id: true, name: true, colour: true } },
  stage: true,
  owner: { select: { id: true, name: true } },
} as const;

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const pipelineId = searchParams.get("pipelineId") ?? undefined;
  const stageId = searchParams.get("stageId") ?? undefined;

  const where = {
    ...(pipelineId ? { pipelineId } : {}),
    ...(stageId ? { stageId } : {}),
    // Staff only ever see their own leads; admins see everything.
    ...(user.role === "STAFF" ? { ownerId: user.id } : {}),
  };

  const leads = await prisma.lead.findMany({
    where,
    include: leadInclude,
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(leads);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || !body.pipelineId || !body.name) {
    return NextResponse.json({ error: "pipelineId and name are required" }, { status: 400 });
  }

  let stageId: string | undefined = body.stageId;
  if (!stageId) {
    await ensureDefaultStages(body.pipelineId);
    const firstStage = await prisma.stage.findFirst({
      where: { pipelineId: body.pipelineId },
      orderBy: { sortOrder: "asc" },
    });
    if (!firstStage) {
      return NextResponse.json({ error: "This pipeline has no stages configured yet" }, { status: 400 });
    }
    stageId = firstStage.id;
  }

  // Staff can only create leads owned by themselves.
  const ownerId = user.role === "ADMIN" ? (body.ownerId ?? user.id) : user.id;

  const lead = await prisma.lead.create({
    data: {
      pipelineId: body.pipelineId,
      stageId,
      ownerId,
      name: body.name,
      company: body.company || null,
      email: body.email || null,
      phone: body.phone || null,
      expectedValue: body.expectedValue != null ? Number(body.expectedValue) : null,
      source: body.source || null,
      notes: body.notes || null,
      nextActionAt: body.nextActionAt ? new Date(body.nextActionAt) : null,
      nextActionNote: body.nextActionNote || null,
    },
    include: leadInclude,
  });

  return NextResponse.json(lead, { status: 201 });
}
