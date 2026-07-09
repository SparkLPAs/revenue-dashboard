import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const stage = await prisma.stage.update({
    where: { id: params.id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.sortOrder !== undefined ? { sortOrder: Number(body.sortOrder) } : {}),
      ...(body.isWon !== undefined ? { isWon: Boolean(body.isWon) } : {}),
      ...(body.isLost !== undefined ? { isLost: Boolean(body.isLost) } : {}),
    },
  });
  return NextResponse.json(stage);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const leadCount = await prisma.lead.count({ where: { stageId: params.id } });
  if (leadCount > 0) {
    return NextResponse.json(
      { error: `${leadCount} lead(s) are still in this stage. Move them first.` },
      { status: 409 }
    );
  }

  await prisma.stage.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
