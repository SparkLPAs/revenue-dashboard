import { PrismaClient } from "@prisma/client";
import { existsSync, readFileSync } from "fs";
const prisma = new PrismaClient();
async function main() {
  const existing = await prisma.pipeline.count();
  if (existing > 0) { console.log(`Database already has ${existing} pipelines — skipping import.`); return; }
  if (!existsSync("data-backup.json")) { console.log("No data-backup.json found — skipping import."); return; }
  const raw = JSON.parse(readFileSync("data-backup.json", "utf8"));
  for (const p of raw.pipelines) {
    const data = { name: p.name, category: p.category, paymentRoute: p.paymentRoute, revenueModel: p.revenueModel, colour: p.colour, active: p.active, hasProducts: p.hasProducts, dayRate: p.dayRate ?? null, sortOrder: p.sortOrder };
    await prisma.pipeline.upsert({ where: { id: p.id }, update: data, create: { id: p.id, ...data } });
  }
  for (const pr of raw.products) {
    const data = { pipelineId: pr.pipelineId, name: pr.name, group: pr.group, price: pr.price, status: pr.status, sortOrder: pr.sortOrder };
    await prisma.product.upsert({ where: { id: pr.id }, update: data, create: { id: pr.id, ...data } });
  }
  for (const e of raw.entries) {
    await prisma.revenueEntry.upsert({ where: { id: e.id }, update: {}, create: { id: e.id, pipelineId: e.pipelineId, productId: e.productId ?? null, date: new Date(e.date), amount: e.amount, label: e.label ?? null, leads: e.leads ?? 0, quantity: e.quantity ?? 1, source: e.source ?? "manual", createdAt: e.createdAt ? new Date(e.createdAt) : undefined } });
  }
  const counts = { pipelines: await prisma.pipeline.count(), products: await prisma.product.count(), entries: await prisma.revenueEntry.count() };
  console.log("Import complete:", JSON.stringify(counts));
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());