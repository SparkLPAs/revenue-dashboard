import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_dummy", { apiVersion: "2024-06-20" });
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    if (secret && sig) { event = stripe.webhooks.constructEvent(rawBody, sig, secret); }
    else { event = JSON.parse(rawBody) as Stripe.Event; }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const pipelineId = session.metadata?.pipelineId;
    if (!pipelineId) return NextResponse.json({ received: true, warning: "No pipelineId in metadata; skipped." }, { status: 200 });
    const pipeline = await prisma.pipeline.findUnique({ where: { id: pipelineId } });
    if (!pipeline) return NextResponse.json({ received: true, warning: `Unknown pipelineId: ${pipelineId}` }, { status: 200 });
    const amount = (session.amount_total ?? 0) / 100;
    const productId = session.metadata?.productId ?? null;
    await prisma.revenueEntry.create({ data: { pipelineId, productId, amount, label: session.metadata?.label ?? session.customer_details?.email ?? "Stripe checkout", source: "stripe", quantity: 1 } });
  }
  return NextResponse.json({ received: true });
}
