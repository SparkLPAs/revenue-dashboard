import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export const runtime = "nodejs";
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pipelineId = searchParams.get("pipelineId") ?? undefined;
  const products = await prisma.product.findMany({ where: pipelineId ? { pipelineId } : undefined, orderBy: [{ group: "asc" }, { sortOrder: "asc" }] });
  return NextResponse.json(products);
}
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !body.name || !body.pipelineId) return NextResponse.json({ error: "name and pipelineId are required" }, { status: 400 });
  const max = await prisma.product.aggregate({ where: { pipelineId: body.pipelineId }, _max: { sortOrder: true } });
  const product = await prisma.product.create({ data: { pipelineId: body.pipelineId, name: body.name, group: body.group ?? "General", price: Number(body.price) || 0, status: body.status ?? "coming_soon", sortOrder: (max._max.sortOrder ?? 0) + 1 } });
  return NextResponse.json(product, { status: 201 });
}
