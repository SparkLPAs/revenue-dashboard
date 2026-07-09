"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF";
  createdAt: string | Date;
  _count: { leads: number };
};

export function UsersManager({ initialUsers, currentUserId }: { initialUsers: UserRow[]; currentUserId: string }) {
  const [users, setUsers] = useState(initialUsers);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "STAFF">("STAFF");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to create user.");
        return;
      }
      setUsers((prev) => [...prev, { ...data, _count: { leads: 0 } }]);
      setName(""); setEmail(""); setPassword(""); setRole("STAFF");
      setShowForm(false);
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleRole(u: UserRow) {
    const newRole = u.role === "ADMIN" ? "STAFF" : "ADMIN";
    const res = await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: updated.role } : x)));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to update role.");
    }
  }

  async function handleDelete(u: UserRow) {
    if (!confirm(`Remove ${u.name}'s access? Their leads stay, but become unassigned.`)) return;
    const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to delete user.");
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-wider text-text-muted">
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Role</th>
                <th className="p-3 font-medium">Leads</th>
                <th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-medium">{u.name}{u.id === currentUserId && <span className="ml-1.5 text-[10px] text-text-muted">(you)</span>}</td>
                  <td className="p-3 text-text-muted">{u.email}</td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleRole(u)}
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wider ${
                        u.role === "ADMIN" ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-background text-text-muted"
                      }`}
                    >
                      {u.role}
                    </button>
                  </td>
                  <td className="p-3 text-text-muted">{u._count.leads}</td>
                  <td className="p-3 text-right">
                    {u.id !== currentUserId && (
                      <button onClick={() => handleDelete(u)} className="text-text-muted hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {showForm ? (
        <Card>
          <CardHeader><CardTitle>New staff account</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="new-name">Name</Label>
                <Input id="new-name" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-email">Email</Label>
                <Input id="new-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-password">Temporary password</Label>
                <Input id="new-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-role">Role</Label>
                <Select id="new-role" value={role} onChange={(e) => setRole(e.target.value as "ADMIN" | "STAFF")}>
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Admin</option>
                </Select>
              </div>
              {error && <p className="text-xs text-red-400 sm:col-span-2">{error}</p>}
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={saving}>{saving ? "Creating…" : "Create account"}</Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-3.5 w-3.5" />
          New Staff Account
        </Button>
      )}
    </div>
  );
}
