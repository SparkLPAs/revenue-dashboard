import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Revenue Ops Dashboard", description: "Unified revenue dashboard across all pipelines." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en" className="dark"><body className="min-h-screen bg-background text-text-primary antialiased font-mono">{children}</body></html>);
}
