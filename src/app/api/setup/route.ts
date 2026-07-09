import { NextResponse } from "next/server";

import { AUTH_COOKIE, SESSION_TTL_MS, signSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export const runtime = "nodejs";

// One-time bootstrap: only works while there are zero users. After the
// first admin is created, use /admin/users (admin-only) to add staff.
export async function POST(req: Request) {
  const existing = await prisma.user.count();
  if (existing > 0) {
    return NextResponse.json({ error: "Setup has already been completed." }, { status: 403 });
  }

  const { name, email, password } = await req.json().catch(() => ({}));
  if (typeof name !== "string" || !name.trim() || typeof email !== "string" || !email.trim() || typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Name, email and an 8+ character password are required." }, { status: 400 });
  }

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: await hashPassword(password),
      role: "ADMIN",
    },
  });

  const token = await signSession({
    userId: user.id,
    role: user.role,
    name: user.name,
    exp: Date.now() + SESSION_TTL_MS,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  return res;
}
