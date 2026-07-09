import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { SetupForm } from "./setup-form";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const userCount = await prisma.user.count();
  if (userCount > 0) redirect("/login");

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <SetupForm />
    </main>
  );
}
