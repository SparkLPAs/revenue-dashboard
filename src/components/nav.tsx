"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, GitBranch, Receipt, Download, LogOut } from "lucide-react";
const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/digital-downloads", label: "Digital Downloads", icon: Download },
  { href: "/pipelines", label: "Pipelines", icon: GitBranch },
  { href: "/entries", label: "Entries", icon: Receipt },
];
export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  async function logout() { await fetch("/api/auth", { method: "DELETE" }); router.push("/login"); router.refresh(); }
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-1 px-4">
        <Link href="/" className="mr-4 flex items-center gap-2"><span className="text-sm font-bold tracking-tight text-accent">◆ REVENUE OPS</span></Link>
        <nav className="flex flex-1 items-center gap-1">
          {links.map((l) => { const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href); const Icon = l.icon;
            return (<Link key={l.href} href={l.href} className={cn("flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors", active ? "bg-border/60 text-text-primary" : "text-text-muted hover:bg-border/40 hover:text-text-primary")}><Icon className="h-3.5 w-3.5" />{l.label}</Link>);
          })}
        </nav>
        <button onClick={logout} className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-border/40 hover:text-text-primary"><LogOut className="h-3.5 w-3.5" />Logout</button>
      </div>
    </header>
  );
}
