import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { leads: true } } },
  });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body || !body.name || !body.email || !body.password) {
    return NextResponse.json({ error: "name, email and password are required" }, { status: 400 });
  }
  if (body.password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase().trim() } });
  if (existing) return NextResponse.json({ error: "A user with that email already exists" }, { status: 409 });

  const created = await prisma.user.create({
    data: {
      name: body.name.trim(),
      email: body.email.toLowerCase().trim(),
      passwordHash: await hashPassword(body.password),
      role: body.role === "ADMIN" ? "ADMIN" : "STAFF",
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  return NextResponse.json(created, { status: 201 });
}
