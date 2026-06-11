import { NextResponse } from "next/server";
import { AUTH_COOKIE, deriveToken } from "@/lib/auth";
export const runtime = "nodejs";
export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  const expected = process.env.DASHBOARD_PASSWORD ?? "";
  if (!expected) return NextResponse.json({ error: "DASHBOARD_PASSWORD is not configured." }, { status: 500 });
  if (typeof password !== "string" || password !== expected) return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, deriveToken(password), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return res;
}
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
