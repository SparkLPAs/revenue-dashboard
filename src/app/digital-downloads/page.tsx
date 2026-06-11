import Link from "next/link";
import { Nav } from "@/components/nav";
import { Card, CardContent } from "@/components/ui/card";
import { ProductManager } from "@/components/product-manager";
import { getDigitalDownloadStats } from "@/lib/stats";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Upload } from "lucide-react";
export const dynamic = "force-dynamic";
export default async function DigitalDownloadsPage() {
  const { groups, totals } = await getDigitalDownloadStats();
  const knownGroups = groups.map((g) => g.group);
  for (const g of ["Startup Guides", "Estate Planning Guides"]) { if (!knownGroups.includes(g)) knownGroups.push(g); }
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary"><ArrowLeft className="h-3.5 w-3.5" /> Dashboard</Link>
          <Link href="/etsy-import" className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-text-muted hover:border-accent-digital hover:text-accent-digital transition">
            <Upload className="h-3.5 w-3.5" /> Import Etsy CSV
          </Link>
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-accent-digital">Digital Downloads</h1>
          <p className="text-xs text-text-muted">Product catalogue · grouped by category</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="p-5"><div className="text-xs uppercase tracking-wider text-text-muted">Total revenue</div><div className="mt-2 text-2xl font-bold">{formatCurrency(totals.total)}</div></CardContent></Card>
          <Card><CardContent className="p-5"><div className="text-xs uppercase tracking-wider text-text-muted">This month</div><div className="mt-2 text-2xl font-bold">{formatCurrency(totals.month)}</div></CardContent></Card>
          <Card><CardContent className="p-5"><div className="text-xs uppercase tracking-wider text-text-muted">Units sold</div><div className="mt-2 text-2xl font-bold">{totals.units}</div></CardContent></Card>
        </div>
        <ProductManager pipelineId="digital-downloads" groups={groups} knownGroups={knownGroups} />
      </main>
    </>
  );
}