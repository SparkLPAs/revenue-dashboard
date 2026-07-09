import { redirect } from "next/navigation";

import { Nav } from "@/components/nav";
import { LeadsBoard } from "@/components/leads/leads-board";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [pipelines, users] = await Promise.all([
    prisma.pipeline.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true, colour: true } }),
    user.role === "ADMIN"
      ? prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
      : Promise.resolve([{ id: user.id, name: user.name }]),
  ]);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Leads</h1>
          <p className="text-xs text-text-muted">
            {user.role === "ADMIN" ? "All leads across every pipeline" : "Your leads"}
          </p>
        </div>
        <LeadsBoard
          pipelines={pipelines}
          users={users}
          currentUser={{ id: user.id, name: user.name, role: user.role }}
        />
      </main>
    </>
  );
}
