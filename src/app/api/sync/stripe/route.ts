import { NextResponse } from "next/server";
import { AUTH_COOKIE, verifySession } from "@/lib/auth";
import { syncAll } from "@/lib/stripe-sync";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
async function authorized(req: Request): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;
  const cookie = req.headers.get("cookie") || "";
  const part = cookie.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${AUTH_COOKIE}=`));
  const token = part ? decodeURIComponent(part.split("=").slice(1).join("=")) : "";
  const session = await verifySession(token);
  return Boolean(session);
}
async function handle(req: Request) {
  if (!(await authorized(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const results = await syncAll();
  const imported = results.reduce((s, r) => s + r.imported, 0);
  return NextResponse.json({ ok: true, imported, results });
}
export async function POST(req: Request) { return handle(req); }
export async function GET(req: Request) { return handle(req); }
