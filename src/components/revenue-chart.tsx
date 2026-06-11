"use client";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { formatCurrency } from "@/lib/utils";
type Point = { date: string; revenue: number };
function shortDate(iso: string): string { const d = new Date(iso); return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }); }
export function RevenueChart({ data }: { data: Point[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1c2128" vertical={false} />
          <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: "#8b949e", fontSize: 10 }} stroke="#1c2128" interval={4} />
          <YAxis tick={{ fill: "#8b949e", fontSize: 10 }} stroke="#1c2128" tickFormatter={(v) => `£${v}`} width={48} />
          <Tooltip cursor={{ fill: "rgba(110,231,183,0.08)" }} contentStyle={{ background: "#0d1117", border: "1px solid #1c2128", borderRadius: 8, fontSize: 12, color: "#e6edf3" }} labelFormatter={(label) => shortDate(String(label))} formatter={(value: number) => [formatCurrency(value), "Revenue"]} />
          <Bar dataKey="revenue" fill="#6EE7B7" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
