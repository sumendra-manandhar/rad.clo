"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import type { Category } from "@/lib/types";
import { PageHeader, inputCls } from "@/components/admin/ui";

export default function CategoriesManager({ categories, counts }: { categories: Category[]; counts: Record<string, number> }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const call = async (url: string, method: string, body?: unknown) => {
    setBusy(true);
    setError("");
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || "Something went wrong.");
      return false;
    }
    router.refresh();
    return true;
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await call("/api/admin/categories", "POST", { name, description })) {
      setName("");
      setDescription("");
    }
  };

  const move = async (i: number, dir: -1 | 1) => {
    const a = categories[i];
    const b = categories[i + dir];
    if (!a || !b) return;
    // Swap sort values (fall back to index if they're equal)
    const sa = a.sort === b.sort ? i : a.sort;
    const sb = a.sort === b.sort ? i + dir : b.sort;
    await call(`/api/admin/categories/${a.id}`, "PATCH", { sort: sb });
    await call(`/api/admin/categories/${b.id}`, "PATCH", { sort: sa });
  };

  return (
    <>
      <PageHeader title="Categories" sub="Group designs so customers can shop by theme. Order here = order in the store." />

      <form onSubmit={add} className="rounded-3xl bg-white border border-line p-5 flex flex-col sm:flex-row gap-3 mb-6">
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name, e.g. Anime" className={inputCls} />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description (optional)" className={inputCls} />
        <button disabled={busy} className="shrink-0 inline-flex items-center justify-center gap-2 bg-ink text-paper text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-flame disabled:opacity-60">
          <Plus className="w-4 h-4" /> Add
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <ul className="rounded-3xl bg-white border border-line divide-y divide-line">
        {categories.map((c, i) => (
          <li key={c.id} className="flex items-center gap-3 p-4">
            <div className="flex flex-col">
              <button disabled={i === 0 || busy} onClick={() => move(i, -1)} className="p-0.5 disabled:opacity-20" aria-label="Move up">
                <ArrowUp className="w-4 h-4" />
              </button>
              <button disabled={i === categories.length - 1 || busy} onClick={() => move(i, 1)} className="p-0.5 disabled:opacity-20" aria-label="Move down">
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>
            {editId === c.id ? (
              <div className="flex-1 flex flex-col sm:flex-row gap-2">
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className={inputCls} />
                <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Description" className={inputCls} />
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-muted truncate">
                  {counts[c.slug] ?? 0} designs · /shop?category={c.slug}
                  {c.description && ` · ${c.description}`}
                </p>
              </div>
            )}
            {editId === c.id ? (
              <>
                <button
                  onClick={async () => (await call(`/api/admin/categories/${c.id}`, "PATCH", { name: editName, description: editDesc })) && setEditId(null)}
                  className="p-2 rounded-lg hover:bg-paper"
                  aria-label="Save"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => setEditId(null)} className="p-2 rounded-lg hover:bg-paper" aria-label="Cancel">
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setEditId(c.id);
                    setEditName(c.name);
                    setEditDesc(c.description ?? "");
                  }}
                  className="p-2 rounded-lg hover:bg-paper"
                  aria-label="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => confirm(`Delete category “${c.name}”?`) && call(`/api/admin/categories/${c.id}`, "DELETE")}
                  className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                  aria-label="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </li>
        ))}
        {categories.length === 0 && <li className="p-10 text-center text-sm text-muted">No categories yet.</li>}
      </ul>
    </>
  );
}
