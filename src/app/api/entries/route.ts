import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export const runtime = "nodejs";
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pipelineId = searchParams.get("pipelineId") ?? undefined;
  const entries = await prisma.revenueEntry.findMany({ where: pipelineId ? { pipelineId } : undefined, orderBy: { date: "desc" }, include: { pipeline: { select: { id: true, name: true, colour: true } }, product: { select: { id: true, name: true } } } });
  return NextResponse.json(entries);
}
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !body.pipelineId) return NextResponse.json({ error: "pipelineId is required" }, { status: 400 });
  let amount = Number(body.amount) || 0;
  let label: string | null = body.label ?? null;
  const quantity = Math.max(1, Number(body.quantity) || 1);
  let productId: string | null = body.productId ?? null;
  if (productId) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    amount = product.price * quantity;
    label = label ?? `${product.name} × ${quantity}`;
  }
  const entry = await prisma.revenueEntry.create({ data: { pipelineId: body.pipelineId, productId, date: body.date ? new Date(body.date) : new Date(), amount, label, leads: Number(body.leads) || 0, quantity, source: "manual" }, include: { pipeline: { select: { id: true, name: true, colour: true } }, product: { select: { id: true, name: true } } } });
  return NextResponse.json(entry, { status: 201 });
}
