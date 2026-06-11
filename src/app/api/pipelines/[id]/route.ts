import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export const runtime = "nodejs";
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const key of ["name","category","paymentRoute","revenueModel","colour","active","hasProducts"]) { if (key in body) data[key] = body[key]; }
  if ("dayRate" in body) data.dayRate = body.dayRate === null ? null : Number(body.dayRate);
  const pipeline = await prisma.pipeline.update({ where: { id: params.id }, data });
  return NextResponse.json(pipeline);
}
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.pipeline.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
