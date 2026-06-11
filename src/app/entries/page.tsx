import { Nav } from "@/components/nav";
import { EntryManager } from "@/components/entry-manager";
import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function EntriesPage() {
  const [pipelines, products, rawEntries] = await Promise.all([
    prisma.pipeline.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({ where: { status: "live" }, orderBy: [{ group: "asc" }, { sortOrder: "asc" }] }),
    prisma.revenueEntry.findMany({ orderBy: { date: "desc" }, take: 200, include: { pipeline: { select: { id: true, name: true, colour: true } }, product: { select: { id: true, name: true } } } }),
  ]);
  const entries = rawEntries.map((e) => ({ id: e.id, date: e.date.toISOString(), amount: e.amount, label: e.label, leads: e.leads, quantity: e.quantity, source: e.source, pipeline: e.pipeline, product: e.product }));
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <div><h1 className="text-lg font-semibold tracking-tight">Entries</h1><p className="text-xs text-text-muted">Log revenue and review all entries</p></div>
        <EntryManager
          pipelines={pipelines.map((p) => ({ id: p.id, name: p.name, hasProducts: p.hasProducts, active: p.active, revenueModel: p.revenueModel, dayRate: p.dayRate }))}
          liveProducts={products.map((p) => ({ id: p.id, name: p.name, price: p.price, pipelineId: p.pipelineId }))}
          entries={entries}
        />
      </main>
    </>
  );
}