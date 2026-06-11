"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
function LoginForm() {
  const router = useRouter(); const params = useSearchParams();
  const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      if (res.ok) { const from = params.get("from") || "/"; router.push(from); router.refresh(); }
      else { const data = await res.json().catch(() => ({})); setError(data.error || "Login failed."); }
    } catch { setError("Network error."); } finally { setLoading(false); }
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader><div className="mb-1 text-sm font-bold tracking-tight text-accent">◆ REVENUE OPS</div><CardTitle className="text-text-muted font-normal">Enter password to continue</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Checking…" : "Sign in"}</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
export default function LoginPage() {
  return (<Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-background p-4"><div className="text-xs text-text-muted">Loading…</div></main>}><LoginForm /></Suspense>);
}