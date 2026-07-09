import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { LoginPageClient } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const userCount = await prisma.user.count();
  if (userCount === 0) redirect("/setup");

  return <LoginPageClient />;
}
