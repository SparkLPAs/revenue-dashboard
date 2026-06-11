import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const pipelines = [
  { id: "osiris-solutions", name: "Osiris Solutions", category: "B2B SaaS", paymentRoute: "Stripe", revenueModel: "Subscription", colour: "#6EE7B7", hasProducts: false, sortOrder: 1 },
  { id: "online-wills", name: "Online-Wills.co.uk", category: "B2C", paymentRoute: "Stripe", revenueModel: "Per-transaction", colour: "#67E8F9", hasProducts: false, sortOrder: 2 },
  { id: "sparkmade", name: "SparkMade", category: "Agency", paymentRoute: "Stripe", revenueModel: "Retainer + Project", colour: "#F0ABFC", hasProducts: false, sortOrder: 3 },
  { id: "spark-works", name: "Spark-Works", category: "Consulting", paymentRoute: "Direct", revenueModel: "Per-project", colour: "#FCD34D", hasProducts: false, sortOrder: 4 },
  { id: "business-advisor", name: "Business Advisor", category: "Contract", paymentRoute: "Direct", revenueModel: "Day rate", colour: "#FDBA74", hasProducts: false, dayRate: 375, sortOrder: 5 },
  { id: "sparklpas", name: "SparkLPAs", category: "B2C SaaS", paymentRoute: "Stripe", revenueModel: "Per-transaction", colour: "#A5B4FC", hasProducts: false, sortOrder: 6 },
  { id: "digital-downloads", name: "Digital Downloads", category: "B2C Content", paymentRoute: "Direct", revenueModel: "Per-sale", colour: "#67E8F9", hasProducts: true, sortOrder: 7 },
  { id: "referral-commission", name: "Referral Commission", category: "Leads", paymentRoute: "Direct", revenueModel: "Per-referral", colour: "#F87171", hasProducts: false, sortOrder: 8 },
];
const products = [
  { name: "UK Startup Guide", group: "Startup Guides", price: 19.99 },
  { name: "Ireland Startup Guide", group: "Startup Guides", price: 19.99 },
  { name: "USA Startup Guide", group: "Startup Guides", price: 19.99 },
  { name: "New Zealand Startup Guide", group: "Startup Guides", price: 19.99 },
  { name: "Canada Startup Guide", group: "Startup Guides", price: 19.99 },
  { name: "Australia Startup Guide", group: "Startup Guides", price: 19.99 },
  { name: "England & Wales Estate Guide", group: "Estate Planning Guides", price: 24.99 },
  { name: "Scotland Estate Guide", group: "Estate Planning Guides", price: 24.99 },
  { name: "N. Ireland Estate Guide", group: "Estate Planning Guides", price: 24.99 },
  { name: "Ireland Estate Guide", group: "Estate Planning Guides", price: 24.99 },
  { name: "USA Estate Guide", group: "Estate Planning Guides", price: 24.99 },
  { name: "New Zealand Estate Guide", group: "Estate Planning Guides", price: 24.99 },
  { name: "Canada Estate Guide", group: "Estate Planning Guides", price: 24.99 },
  { name: "Australia Estate Guide", group: "Estate Planning Guides", price: 24.99 },
];
async function main() {
  for (const p of pipelines) { await prisma.pipeline.upsert({ where: { id: p.id }, update: { name: p.name, category: p.category, paymentRoute: p.paymentRoute, revenueModel: p.revenueModel, colour: p.colour, hasProducts: p.hasProducts, dayRate: (p as any).dayRate ?? null, sortOrder: p.sortOrder }, create: { ...p, active: true } }); }
  let order = 1;
  for (const prod of products) { await prisma.product.upsert({ where: { pipelineId_name: { pipelineId: "digital-downloads", name: prod.name } }, update: { group: prod.group, price: prod.price }, create: { pipelineId: "digital-downloads", name: prod.name, group: prod.group, price: prod.price, status: "coming_soon", sortOrder: order } }); order++; }
  console.log("Seeded:", await prisma.pipeline.count(), "pipelines,", await prisma.product.count(), "products");
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });