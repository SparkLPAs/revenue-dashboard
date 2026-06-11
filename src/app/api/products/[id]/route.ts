import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export const runtime = "nodejs";
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if ("name" in body) data.name = body.name;
  if ("group" in body) data.group = body.group;
  if ("price" in body) data.price = Number(body.price) || 0;
  if ("status" in body) data.status = body.status;
  const product = await prisma.product.update({ where: { id: params.id }, data });
  return NextResponse.json(product);
}
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
