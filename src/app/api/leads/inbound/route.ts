import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { ensureDefaultStages } from "@/lib/stages";

export const runtime = "nodejs";

// Server-to-server endpoint for external sites (contact/demo forms, inbound
// email parsers) to create a lead directly -- no user session involved, so
// it authenticates via a shared secret instead. Add to each site's form
// handler: POST here alongside (or instead of) sending a notification email.
export async function POST(req: Request) {
  const secret = process.env.LEADS_INBOUND_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "LEADS_INBOUND_SECRET is not configured" }, { status: 500 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.pipelineId || !body.name) {
    return NextResponse.json({ error: "pipelineId and name are required" }, { status: 400 });
  }

  const pipeline = await prisma.pipeline.findUnique({ where: { id: body.pipelineId } });
  if (!pipeline) {
    const valid = (await prisma.pipeline.findMany({ select: { id: true } })).map((p) => p.id);
    return NextResponse.json(
      { error: `Unknown pipelineId "${body.pipelineId}". Valid options: ${valid.join(", ")}` },
      { status: 400 }
    );
  }

  await ensureDefaultStages(body.pipelineId);
  const firstStage = await prisma.stage.findFirst({
    where: { pipelineId: body.pipelineId },
    orderBy: { sortOrder: "asc" },
  });
  if (!firstStage) {
    return NextResponse.json({ error: "This pipeline has no stages configured" }, { status: 500 });
  }

  const lead = await prisma.lead.create({
    data: {
      pipelineId: body.pipelineId,
      stageId: firstStage.id,
      // Unassigned -- an admin triages and assigns it from the board.
      ownerId: null,
      name: body.name,
      company: body.company || null,
      email: body.email || null,
      phone: body.phone || null,
      source: body.source || "Website form",
      notes: body.message || null,
    },
  });

  return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
}
