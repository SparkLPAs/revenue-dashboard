import { prisma } from "@/lib/db";
export function startOfMonth(d = new Date()): Date { return new Date(d.getFullYear(), d.getMonth(), 1); }
export function startOfToday(d = new Date()): Date { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
export function daysAgo(n: number, d = new Date()): Date { const r = new Date(d.getFullYear(), d.getMonth(), d.getDate()); r.setDate(r.getDate() - n); return r; }
export type DashboardData = { totalRevenue: number; monthRevenue: number; todayRevenue: number; totalLeads: number; chart: { date: string; revenue: number }[]; pipelines: PipelineSummary[]; };
export type PipelineSummary = { id: string; name: string; category: string; paymentRoute: string; revenueModel: string; colour: string; active: boolean; hasProducts: boolean; total: number; month: number; leads: number; entryCount: number; };
export async function getDashboardData(): Promise<DashboardData> {
  const monthStart = startOfMonth(); const todayStart = startOfToday(); const windowStart = daysAgo(29);
  const [pipelines, entries] = await Promise.all([
    prisma.pipeline.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.revenueEntry.findMany({ select: { pipelineId: true, amount: true, leads: true, date: true } }),
  ]);
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let totalRevenue = 0; let monthRevenue = 0; let todayRevenue = 0; let totalLeads = 0;
  const perPipeline = new Map<string, { total: number; month: number; leads: number; count: number }>();
  const buckets = new Map<string, number>();
  for (let i = 29; i >= 0; i--) { const d = daysAgo(i); buckets.set(d.toISOString().slice(0, 10), 0); }
  for (const e of entries) {
    if (e.date > todayEnd) continue;
    totalRevenue += e.amount; totalLeads += e.leads;
    if (e.date >= monthStart) monthRevenue += e.amount;
    if (e.date >= todayStart) todayRevenue += e.amount;
    const agg = perPipeline.get(e.pipelineId) ?? { total: 0, month: 0, leads: 0, count: 0 };
    agg.total += e.amount; agg.leads += e.leads; agg.count += 1;
    if (e.date >= monthStart) agg.month += e.amount;
    perPipeline.set(e.pipelineId, agg);
    if (e.date >= windowStart) { const key = e.date.toISOString().slice(0, 10); if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + e.amount); }
  }
  const summaries: PipelineSummary[] = pipelines.map((p) => { const agg = perPipeline.get(p.id); return { id: p.id, name: p.name, category: p.category, paymentRoute: p.paymentRoute, revenueModel: p.revenueModel, colour: p.colour, active: p.active, hasProducts: p.hasProducts, total: agg?.total ?? 0, month: agg?.month ?? 0, leads: agg?.leads ?? 0, entryCount: agg?.count ?? 0 }; });
  return { totalRevenue, monthRevenue, todayRevenue, totalLeads, chart: Array.from(buckets.entries()).map(([date, revenue]) => ({ date, revenue })), pipelines: summaries };
}
export type ProductStat = { id: string; name: string; group: string; price: number; status: string; total: number; month: number; units: number; };
export async function getDigitalDownloadStats(): Promise<{ groups: { group: string; products: ProductStat[] }[]; totals: { total: number; month: number; units: number }; }> {
  const monthStart = startOfMonth();
  const products = await prisma.product.findMany({ where: { pipelineId: "digital-downloads" }, orderBy: [{ group: "asc" }, { sortOrder: "asc" }], include: { entries: { select: { amount: true, quantity: true, date: true } } } });
  const totals = { total: 0, month: 0, units: 0 };
  const byGroup = new Map<string, ProductStat[]>();
  for (const p of products) {
    let total = 0; let month = 0; let units = 0;
    for (const e of p.entries) { total += e.amount; units += e.quantity; if (e.date >= monthStart) month += e.amount; }
    totals.total += total; totals.month += month; totals.units += units;
    const stat: ProductStat = { id: p.id, name: p.name, group: p.group, price: p.price, status: p.status, total, month, units };
    const arr = byGroup.get(p.group) ?? []; arr.push(stat); byGroup.set(p.group, arr);
  }
  return { groups: Array.from(byGroup.entries()).map(([group, products]) => ({ group, products })), totals };
}
