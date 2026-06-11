import { Nav } from "@/components/nav";
import { PipelineManager } from "@/components/pipeline-manager";
import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function PipelinesPage() {
  const pipelines = await prisma.pipeline.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <div><h1 className="text-lg font-semibold tracking-tight">Pipelines</h1><p className="text-xs text-text-muted">Add, edit, pause/resume, or delete revenue pipelines</p></div>
        <PipelineManager pipelines={pipelines} />
      </main>
    </>
  );
}