import { PrismaClient } from "@prisma/client";
import { existsSync, readFileSync } from "fs";
const prisma = new PrismaClient();

// Pipelines added after the initial data-backup.json import below (which
// only ever runs once, before any pipelines exist) — upserted on every
// build so a fresh one added in code actually appears without needing a
// manual DB insert. Update-safe: only touched fields are the ones a code
// change would want to control; nothing here overwrites lastStripeSync,
// active, or sortOrder once a real deploy has set them.
const CODE_SEEDED_PIPELINES = [
  {
    // Not "spark-solutions" — an existing pipeline already has that exact
    // id (a Leads/Enquiry pipeline tracking marketing-site demo requests,
    // unrelated to this one), which the id-based existence check below
    // would otherwise have silently matched and skipped, meaning this
    // pipeline never actually got created despite the build log showing
    // one more pipeline than before (that extra one was pre-existing, not
    // this one).
    id: "spark-solutions-subscriptions",
    name: "Spark Solutions Subscriptions",
    category: "B2B SaaS",
    paymentRoute: "Stripe",
    revenueModel: "Subscription",
    colour: "#93C5FD",
    hasProducts: false,
  },
];

async function ensureCodeSeededPipelines() {
  const max = await prisma.pipeline.aggregate({ _max: { sortOrder: true } });
  let nextSortOrder = (max._max.sortOrder ?? 0) + 1;
  for (const p of CODE_SEEDED_PIPELINES) {
    const existing = await prisma.pipeline.findUnique({ where: { id: p.id } });
    if (existing) continue;
    await prisma.pipeline.create({ data: { ...p, sortOrder: nextSortOrder } });
    nextSortOrder++;
    console.log(`Created pipeline: ${p.id}`);
  }
}

async function main() {
  await ensureCodeSeededPipelines();
  const existing = await prisma.pipeline.count();
  if (existing > CODE_SEEDED_PIPELINES.length) { console.log(`Database already has ${existing} pipelines — skipping historical import.`); return; }
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