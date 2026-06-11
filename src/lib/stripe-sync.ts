import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { STRIPE_ACCOUNTS, type StripeAccount } from "@/lib/stripe-accounts";
export type SyncResult = { pipelineId: string; label: string; configured: boolean; imported: number; scanned: number; error?: string; };
export async function syncAccount(account: StripeAccount): Promise<SyncResult> {
  const key = process.env[account.envKey];
  const base: SyncResult = { pipelineId: account.pipelineId, label: account.label, configured: Boolean(key), imported: 0, scanned: 0 };
  if (!key) return base;
  try {
    const stripe = new Stripe(key, { apiVersion: "2024-06-20" });
    const pipeline = await prisma.pipeline.findUnique({ where: { id: account.pipelineId } });
    const params: Stripe.ChargeListParams = { limit: 100 };
    if (pipeline?.lastStripeSync) {
      params.created = { gte: Math.floor(pipeline.lastStripeSync.getTime() / 1000) - 3600 };
    }
    let imported = 0; let scanned = 0;
    for await (const charge of stripe.charges.list(params)) {
      scanned++;
      if (charge.status !== "succeeded" || !charge.paid) continue;
      const captured = charge.amount_captured ?? charge.amount;
      const net = (captured - (charge.amount_refunded ?? 0)) / 100;
      if (net <= 0) continue;
      try {
        await prisma.revenueEntry.create({ data: { pipelineId: account.pipelineId, stripeId: charge.id, date: new Date(charge.created * 1000), amount: net, label: charge.description || charge.billing_details?.email || "Stripe payment", source: "stripe" } });
        imported++;
      } catch { /* duplicate — skip */ }
    }
    await prisma.pipeline.update({ where: { id: account.pipelineId }, data: { lastStripeSync: new Date() } });
    return { ...base, imported, scanned };
  } catch (e) {
    return { ...base, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
export async function syncAll(): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  for (const account of STRIPE_ACCOUNTS) {
    if (!process.env[account.envKey]) continue;
    results.push(await syncAccount(account));
  }
  return results;
}
