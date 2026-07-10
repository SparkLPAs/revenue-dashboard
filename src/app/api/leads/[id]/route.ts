import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

const leadInclude = {
  pipeline: { select: { id: true, name: true, colour: true } },
  stage: true,
  owner: { select: { id: true, name: true } },
  activity: { orderBy: { createdAt: "desc" as const }, include: { author: { select: { id: true, name: true } } } },
} as const;

// Any signed-in user (admin or staff) can see and edit any lead -- there's
// only ever one office team, so leads aren't siloed per person.
async function loadLead(id: string) {
  const lead = await prisma.lead.findUnique({ where: { id }, include: leadInclude });
  return lead;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lead = await loadLead(params.id);
  if (lead === null) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(lead);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await loadLead(params.id);
  if (existing === null) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  // Only admins can reassign a lead to a different owner.
  const ownerId = user.role === "ADMIN" && "ownerId" in body ? body.ownerId : undefined;

  const data: Record<string, unknown> = {
    ...(body.name !== undefined ? { name: body.name } : {}),
    ...(body.company !== undefined ? { company: body.company || null } : {}),
    ...(body.email !== undefined ? { email: body.email || null } : {}),
    ...(body.phone !== undefined ? { phone: body.phone || null } : {}),
    ...(body.expectedValue !== undefined ? { expectedValue: body.expectedValue != null ? Number(body.expectedValue) : null } : {}),
    ...(body.source !== undefined ? { source: body.source || null } : {}),
    ...(body.notes !== undefined ? { notes: body.notes || null } : {}),
    ...(body.nextActionAt !== undefined ? { nextActionAt: body.nextActionAt ? new Date(body.nextActionAt) : null } : {}),
    ...(body.nextActionNote !== undefined ? { nextActionNote: body.nextActionNote || null } : {}),
    ...(ownerId !== undefined ? { ownerId } : {}),
  };

  let revenueEntryId = existing.revenueEntryId;

  if (body.stageId && body.stageId !== existing.stageId) {
    const newStage = await prisma.stage.findUnique({ where: { id: body.stageId } });
    if (!newStage || newStage.pipelineId !== existing.pipelineId) {
      return NextResponse.json({ error: "Invalid stage for this pipeline" }, { status: 400 });
    }
    data.stageId = newStage.id;

    if ((newStage.isWon || newStage.isLost) && !existing.closedAt) {
      data.closedAt = new Date();
    }

    if (newStage.isWon && !existing.revenueEntryId) {
      const revenueEntry = await prisma.revenueEntry.create({
        data: {
          pipelineId: existing.pipelineId,
          amount: existing.expectedValue ?? 0,
          label: existing.name,
          source: "lead",
        },
      });
      revenueEntryId = revenueEntry.id;
      data.revenueEntryId = revenueEntry.id;
    }
  }

  const lead = await prisma.lead.update({ where: { id: params.id }, data, include: leadInclude });
  return NextResponse.json({ ...lead, revenueEntryId });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await loadLead(params.id);
  if (existing === null) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.lead.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
