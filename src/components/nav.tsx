import { getCurrentUser } from "@/lib/session";
import { NavClient } from "./nav-client";

export async function Nav() {
  const user = await getCurrentUser();
  if (!user) return null;
  return <NavClient name={user.name} role={user.role} />;
}
