import Link from "next/link";
import { Nav } from "@/components/nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueChart } from "@/components/revenue-chart";
import { getDashboardData } from "@/lib/stats";
import { formatCurrency } from "@/lib/utils";
import { ChevronRight, TrendingUp, CalendarDays, Clock, Users } from "lucide-react";
import { SyncButton } from "@/components/sync-button";
export const dynamic = "force-dynamic";
export default async function DashboardPage() {
  const data = await getDashboardData();
  const kpis = [
    { label: "Total Revenue", value: formatCurrency(data.totalRevenue), icon: TrendingUp },
    { label: "This Month", value: formatCurrency(data.monthRevenue), icon: CalendarDays },
    { label: "Today", value: formatCurrency(data.todayRevenue), icon: Clock },
    { label: "Total Leads", value: String(data.totalLeads), icon: Users },
  ];
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
            <p className="text-xs text-text-muted">Unified revenue across all pipelines</p>
          </div>
          <SyncButton />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {kpis.map((k) => { const Icon = k.icon; return (
            <Card key={k.label}><CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-text-muted">{k.label}</span>
                <Icon className="h-4 w-4 text-accent" />
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight">{k.value}</div>
            </CardContent></Card>
          ); })}
        </div>
        <Card>
          <CardHeader><CardTitle>30-Day Revenue</CardTitle><p className="text-xs text-text-muted">All pipelines · last 30 days</p></CardHeader>
          <CardContent><RevenueChart data={data.chart} /></CardContent>
        </Card>
        <div>
          <h2 className="mb-3 text-sm font-semibold tracking-tight">Pipelines</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.pipelines.map((p) => {
              const inner = (
                <Card className={p.hasProducts ? "group h-full cursor-pointer transition-colors hover:border-accent-digital/60" : "h-full"}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.colour }} />
                        <span className="text-sm font-semibold">{p.name}</span>
                      </div>
                      {p.hasProducts && <ChevronRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent-digital" />}
                    </div>
                    <div className="mt-1 text-[11px] uppercase tracking-wider text-text-muted">{p.category} · {p.revenueModel}</div>
                    <div className="mt-4 space-y-1">
                      <div className="flex items-baseline justify-between"><span className="text-xs text-text-muted">Total</span><span className="text-lg font-bold">{formatCurrency(p.total)}</span></div>
                      <div className="flex items-baseline justify-between"><span className="text-xs text-text-muted">Month</span><span className="text-sm">{formatCurrency(p.month)}</span></div>
                      {!p.active && <div className="pt-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Paused</div>}
                    </div>
                  </CardContent>
                </Card>
              );
              return p.hasProducts ? (<Link key={p.id} href="/digital-downloads">{inner}</Link>) : (<div key={p.id}>{inner}</div>);
            })}
          </div>
        </div>
      </main>
    </>
  );
}