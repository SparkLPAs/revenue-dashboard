import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export const runtime = "nodejs";
export async function GET() {
  const pipelines = await prisma.pipeline.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(pipelines);
}
function slugify(name: string): string { return (name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `pipeline-${Date.now()}`); }
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !body.name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  let id = slugify(body.name);
  if (await prisma.pipeline.findUnique({ where: { id } })) id = `${id}-${Date.now().toString(36)}`;
  const max = await prisma.pipeline.aggregate({ _max: { sortOrder: true } });
  const pipeline = await prisma.pipeline.create({ data: { id, name: body.name, category: body.category ?? "", paymentRoute: body.paymentRoute ?? "Direct", revenueModel: body.revenueModel ?? "", colour: body.colour ?? "#6EE7B7", active: body.active ?? true, hasProducts: body.hasProducts ?? false, sortOrder: (max._max.sortOrder ?? 0) + 1 } });
  return NextResponse.json(pipeline, { status: 201 });
}
