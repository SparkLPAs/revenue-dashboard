import { cookies } from "next/headers";

import { AUTH_COOKIE, verifySession, type SessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(AUTH_COOKIE)?.value;
  return verifySession(token);
}

// Re-fetches the live user row (role/name may have changed since the
// cookie was issued) -- use this wherever a stale role would matter.
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.userId } });
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Forbidden");
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}
