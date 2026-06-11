"use client";
import { useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
interface ImportResult { imported: number; skipped: number; duplicates: number; message: string; }
export default function EtsyImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function handleImport() {
    if (!file) return;
    setLoading(true); setError(null); setResult(null);
    const form = new FormData(); form.append("file", file);
    const res = await fetch("/api/etsy-import", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Import failed"); } else { setResult(data); }
    setLoading(false);
  }
  return (
    <div className="min-h-screen bg-background text-text-primary font-mono">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
          <Link href="/" className="text-sm font-bold tracking-tight text-accent">◆ REVENUE OPS</Link>
          <span className="text-text-muted text-xs">→</span>
          <span className="text-xs text-text-muted">Etsy CSV Import</span>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-4 py-12 space-y-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-accent-digital">Import Etsy Sales</h1>
          <p className="text-xs text-text-muted mt-1">Upload your monthly Etsy orders CSV to sync sales into the Digital Downloads pipeline.</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5 text-xs space-y-2">
          <div className="font-semibold text-text-primary mb-3">How to get your Etsy CSV:</div>
          {["Go to Etsy Shop Manager","Click Settings → Options","Click the Download Data tab","Under Orders — select CSV Type: Order, choose Month & Year","Click Download CSV","Upload the file below"].map((step, i) => (
            <div key={i} className="flex gap-3"><span className="text-accent font-bold w-4 flex-shrink-0">{i + 1}.</span><span className="text-text-muted">{step}</span></div>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <label className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 cursor-pointer transition ${file ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}`}>
            <div className="text-3xl mb-2">{file ? "✓" : "⬆"}</div>
            <div className="text-sm font-medium text-text-primary">{file ? file.name : "Click to choose CSV file"}</div>
            <div className="text-xs text-text-muted mt-1">{file ? `${(file.size / 1024).toFixed(1)} KB` : ".csv files only"}</div>
            <input type="file" accept=".csv" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] || null); setResult(null); setError(null); }} />
          </label>
          <button onClick={handleImport} disabled={!file || loading}
            className="w-full rounded-md bg-accent py-2.5 text-sm font-medium text-background hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition">
            {loading ? "Importing…" : "Import Sales"}
          </button>
        </div>
        {result && (
          <div className="rounded-lg border border-green-800/40 bg-green-950/30 p-5 space-y-3">
            <div className="text-sm font-semibold text-green-400">Import Complete ✓</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center"><div className="text-2xl font-bold text-text-primary">{result.imported}</div><div className="text-xs text-text-muted mt-0.5">Imported</div></div>
              <div className="text-center"><div className="text-2xl font-bold text-text-muted">{result.duplicates}</div><div className="text-xs text-text-muted mt-0.5">Already existed</div></div>
              <div className="text-center"><div className="text-2xl font-bold text-text-muted">{result.skipped}</div><div className="text-xs text-text-muted mt-0.5">Skipped</div></div>
            </div>
            <div className="text-xs text-text-muted">{result.message}</div>
            <Link href="/digital-downloads" className="block text-center rounded-md border border-border px-4 py-2 text-xs text-text-muted hover:text-text-primary transition">View Digital Downloads →</Link>
          </div>
        )}
        {error && <div className="rounded-lg border border-red-800/40 bg-red-950/30 p-4 text-sm text-red-400">{error}</div>}
        <div className="text-xs text-text-muted text-center">Safe to re-import — duplicate orders are automatically detected and skipped.</div>
      </main>
    </div>
  );
}
