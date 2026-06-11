import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export const runtime = "nodejs";

function parseDate(raw: string): Date {
  // Etsy UK format: DD/MM/YY
  const parts = raw.trim().split("/");
  if (parts.length !== 3) return new Date();
  const [day, month, year] = parts;
  return new Date(`20${year}-${month.padStart(2,"0")}-${day.padStart(2,"0")}T12:00:00Z`);
}

function parseCsvLine(line: string): string[] {
  const cols: string[] = []; let current = ""; let inQuotes = false;
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes; continue; }
    if (char === "," && !inQuotes) { cols.push(current.trim()); current = ""; continue; }
    current += char;
  }
  cols.push(current.trim());
  return cols;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  const text = await file.text();
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return NextResponse.json({ error: "Empty CSV" }, { status: 400 });

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, " "));
  const saleDateIdx  = headers.findIndex((h) => h.includes("sale date"));
  const orderIdIdx   = headers.findIndex((h) => h.includes("order id"));
  const orderNetIdx  = headers.findIndex((h) => h === "order net");

  if (saleDateIdx === -1 || orderNetIdx === -1) {
    return NextResponse.json({ error: "CSV format not recognised — please use the Etsy Orders CSV export (Settings → Options → Download Data)" }, { status: 400 });
  }

  // Find digital-downloads pipeline
  const pipeline = await prisma.pipeline.findFirst({ where: { id: "digital-downloads" } });
  if (!pipeline) return NextResponse.json({ error: "Digital Downloads pipeline not found" }, { status: 404 });

  let imported = 0; let skipped = 0; let duplicates = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 3) continue;
    const rawDate = cols[saleDateIdx] || "";
    const orderId = cols[orderIdIdx]  || "";
    const rawNet  = cols[orderNetIdx] || "0";
    const netAmount = parseFloat(rawNet.replace(/[£$€,]/g, ""));
    if (!rawDate || isNaN(netAmount) || netAmount <= 0) { skipped++; continue; }
    const etsynId = `etsy-${orderId}`;
    if (orderId) {
      const existing = await prisma.revenueEntry.findFirst({ where: { stripeId: etsynId } });
      if (existing) { duplicates++; continue; }
    }
    try {
      await prisma.revenueEntry.create({ data: { pipelineId: "digital-downloads", date: parseDate(rawDate), amount: netAmount, label: `Etsy order #${orderId}`, quantity: 1, source: "manual", stripeId: orderId ? etsynId : undefined } });
      imported++;
    } catch { skipped++; }
  }

  return NextResponse.json({ imported, skipped, duplicates, message: `${imported} sales imported, ${duplicates} already existed, ${skipped} skipped` });
}
