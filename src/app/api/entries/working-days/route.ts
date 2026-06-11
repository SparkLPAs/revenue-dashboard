import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export const runtime = "nodejs";
type Region = "england-and-wales" | "scotland" | "northern-ireland";
const pad = (n: number) => String(n).padStart(2, "0");
const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
async function fetchBankHolidays(region: Region): Promise<Set<string> | null> {
  try {
    const res = await fetch("https://www.gov.uk/bank-holidays.json", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, { events: { date: string }[] }>;
    return new Set((data[region]?.events ?? []).map((e) => e.date));
  } catch { return null; }
}
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !body.pipelineId || !body.start || !body.end) return NextResponse.json({ error: "pipelineId, start and end are required" }, { status: 400 });
  const pipeline = await prisma.pipeline.findUnique({ where: { id: body.pipelineId } });
  if (!pipeline) return NextResponse.json({ error: "Pipeline not found" }, { status: 404 });
  const region: Region = (["england-and-wales","scotland","northern-ireland"] as Region[]).includes(body.region) ? body.region : "england-and-wales";
  const rate = Number(body.rate) || pipeline.dayRate || 0;
  if (rate <= 0) return NextResponse.json({ error: "A positive day rate is required" }, { status: 400 });
  const preview = body.preview === true;
  const start = new Date(`${body.start}T12:00:00`);
  const end = new Date(`${body.end}T12:00:00`);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  const holidays = await fetchBankHolidays(region);
  const existing = await prisma.revenueEntry.findMany({ where: { pipelineId: pipeline.id, date: { gte: new Date(`${body.start}T00:00:00`), lte: new Date(`${body.end}T23:59:59`) } }, select: { date: true } });
  const existingDays = new Set(existing.map((e) => fmt(e.date)));
  let workingDays = 0; let holidaysExcluded = 0; let alreadyLogged = 0;
  const toCreate: { date: Date; key: string }[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    const key = fmt(d);
    if (holidays && holidays.has(key)) { holidaysExcluded++; continue; }
    if (existingDays.has(key)) { alreadyLogged++; continue; }
    workingDays++;
    toCreate.push({ date: new Date(`${key}T12:00:00`), key });
  }
  const total = workingDays * rate;
  if (preview) return NextResponse.json({ preview: true, workingDays, holidaysExcluded, alreadyLogged, rate, total, holidaysUnavailable: holidays === null });
  if (toCreate.length > 0) await prisma.revenueEntry.createMany({ data: toCreate.map((c) => ({ pipelineId: pipeline.id, date: c.date, amount: rate, label: "Day rate", leads: 0, quantity: 1, source: "manual" })) });
  if (rate !== pipeline.dayRate) await prisma.pipeline.update({ where: { id: pipeline.id }, data: { dayRate: rate } });
  return NextResponse.json({ created: workingDays, holidaysExcluded, alreadyLogged, rate, total, holidaysUnavailable: holidays === null });
}
