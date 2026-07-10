import { redirect } from "next/navigation";

import { Nav } from "@/components/nav";
import { UsersManager } from "@/components/admin/users-manager";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { leads: true } } },
  });

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Staff Accounts</h1>
          <p className="text-xs text-text-muted">Manage who can access the dashboard, and their role</p>
        </div>
        <UsersManager initialUsers={users} currentUserId={user.id} />
      </main>
    </>
  );
}
