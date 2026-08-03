"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, Eye, EyeOff, Loader2, Plus } from "lucide-react";
import {
  fetchAllSupabaseDesigns,
  createSupabaseDesign,
  toggleSupabaseDesignActive,
  deleteSupabaseDesign,
  DESIGN_CATEGORIES,
  type AdminDesignRow,
} from "@/lib/designs";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function AdminDesignsPage() {
  const [designs, setDesigns] = useState<AdminDesignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(DESIGN_CATEGORIES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    setDesigns(await fetchAllSupabaseDesigns());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    if (!name) setName(f.name.replace(/\.[^.]+$/, ""));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name) return;
    setSaving(true);
    const ok = await createSupabaseDesign(file, name, category);
    setSaving(false);
    if (ok) {
      setShowForm(false);
      setFile(null);
      setPreview(null);
      setName("");
      await load();
    }
  };

  const handleToggle = async (row: AdminDesignRow) => {
    setDesigns((prev) =>
      prev.map((d) => (d.id === row.id ? { ...d, is_active: !d.is_active } : d))
    );
    await toggleSupabaseDesignActive(row.id, !row.is_active);
  };

  const handleDelete = async (row: AdminDesignRow) => {
    if (!confirm(`Delete "${row.name}"? This can't be undone.`)) return;
    setDesigns((prev) => prev.filter((d) => d.id !== row.id));
    await deleteSupabaseDesign(row.id);
  };

  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Print Designs</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Manage the gallery customers pick from in "Choose a Print". These
            appear alongside the built-in designs automatically.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 bg-neutral-900 text-white text-sm font-semibold px-4 py-2.5 rounded-full hover:bg-neutral-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Design
        </button>
      </div>

      {!isSupabaseConfigured && (
        <div className="mb-6 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
          Supabase isn't configured — designs can't be saved until it's
          connected. See SETUP.md.
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSave}
          className="mb-6 bg-white border border-neutral-200 rounded-xl p-5 flex gap-5"
        >
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-28 h-28 shrink-0 border-2 border-dashed border-neutral-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-neutral-500 transition-colors overflow-hidden"
          >
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <Upload className="w-5 h-5 text-neutral-400" />
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex-1 space-y-2.5">
            <input
              required
              placeholder="Design name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neutral-900"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neutral-900"
            >
              {DESIGN_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="Uploaded">Uploaded (custom category)</option>
            </select>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!file || saving}
                className="flex items-center gap-1.5 bg-neutral-900 text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-neutral-700 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {saving ? "Saving…" : "Save Design"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-xs font-medium text-neutral-500 hover:text-neutral-900 px-3"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-neutral-400">Loading…</p>
      ) : designs.length === 0 ? (
        <p className="text-sm text-neutral-400">
          No designs uploaded yet — click "Add Design" to add your first one.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {designs.map((d) => (
            <div
              key={d.id}
              className={`border rounded-xl overflow-hidden bg-white ${
                d.is_active ? "border-neutral-200" : "border-neutral-200 opacity-50"
              }`}
            >
              <div className="aspect-square bg-neutral-50">
                <img src={d.image_url} alt={d.name} className="w-full h-full object-contain" />
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold text-neutral-900 truncate">{d.name}</p>
                <p className="text-[11px] text-neutral-400">{d.category || "Uncategorized"}</p>
                <div className="flex items-center justify-between mt-2">
                  <button
                    onClick={() => handleToggle(d)}
                    className="flex items-center gap-1 text-[11px] font-medium text-neutral-500 hover:text-neutral-900"
                    title={d.is_active ? "Hide from gallery" : "Show in gallery"}
                  >
                    {d.is_active ? (
                      <>
                        <Eye className="w-3.5 h-3.5" /> Active
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" /> Hidden
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(d)}
                    className="text-neutral-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
