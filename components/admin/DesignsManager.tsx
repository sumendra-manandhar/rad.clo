"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, Trash2, Star, Eye, EyeOff, X, Loader2, ImagePlus } from "lucide-react";
import type { Category, Design } from "@/lib/types";
import { formatPrice } from "@/lib/garments";
import { PageHeader, inputCls } from "@/components/admin/ui";

type Editing = { mode: "new" } | { mode: "edit"; design: Design } | null;

export default function DesignsManager({ designs, categories }: { designs: Design[]; categories: Category[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Editing>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState<"all" | "live" | "hidden" | "featured">("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const catName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? "Uncategorised";

  const list = useMemo(
    () =>
      designs.filter(
        (d) =>
          (cat === "all" || d.category === cat) &&
          (status === "all" ||
            (status === "live" && d.active) ||
            (status === "hidden" && !d.active) ||
            (status === "featured" && d.featured)) &&
          (!q || d.name.toLowerCase().includes(q.toLowerCase()))
      ),
    [designs, cat, status, q]
  );

  const patch = async (d: Design, fields: Record<string, string>) => {
    setBusyId(d.id);
    const fd = new FormData();
    Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
    const res = await fetch(`/api/admin/designs/${d.id}`, { method: "PATCH", body: fd });
    setBusyId(null);
    if (!res.ok) return alert((await res.json()).error || "Update failed");
    router.refresh();
  };

  const remove = async (d: Design) => {
    if (!confirm(`Delete “${d.name}”? This can't be undone.`)) return;
    setBusyId(d.id);
    const res = await fetch(`/api/admin/designs/${d.id}`, { method: "DELETE" });
    setBusyId(null);
    if (!res.ok) return alert((await res.json()).error || "Delete failed");
    router.refresh();
  };

  return (
    <>
      <PageHeader title="Designs" sub={`${designs.length} designs · ${designs.filter((d) => d.active).length} live in the store`}>
        <button
          onClick={() => setEditing({ mode: "new" })}
          disabled={categories.length === 0}
          className="inline-flex items-center gap-2 bg-ink text-paper text-sm font-semibold px-5 py-3 rounded-full hover:bg-flame transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Add design
        </button>
      </PageHeader>

      {categories.length === 0 && (
        <p className="mb-6 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
          Create a category first — every design needs one.
        </p>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search designs" className={`${inputCls} pl-10`} />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className={`${inputCls} w-auto`}>
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="flex gap-1 bg-white border border-line rounded-xl p-1">
          {(["all", "live", "hidden", "featured"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${status === s ? "bg-ink text-paper" : "hover:bg-paper"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line py-20 text-center text-sm text-muted">No designs match.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {list.map((d) => (
            <div key={d.id} className={`rounded-2xl bg-white border border-line overflow-hidden ${d.active ? "" : "opacity-60"}`}>
              <div className="relative aspect-square bg-paper">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.image} alt={d.name} className="w-full h-full object-contain p-4" />
                <div className="absolute top-2 left-2 flex gap-1">
                  {!d.active && <span className="text-[10px] font-semibold bg-neutral-800 text-white px-2 py-0.5 rounded-full">Hidden</span>}
                  {d.featured && <span className="text-[10px] font-semibold bg-lime px-2 py-0.5 rounded-full">Featured</span>}
                </div>
                {busyId === d.id && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm truncate">{d.name}</p>
                <p className="text-xs text-muted truncate">
                  {catName(d.category)} · design {formatPrice(d.price)}
                </p>
                <div className="flex items-center gap-1 mt-3 -ml-1.5">
                  <IconBtn title={d.active ? "Hide from store" : "Show in store"} onClick={() => patch(d, { active: String(!d.active) })}>
                    {d.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </IconBtn>
                  <IconBtn title={d.featured ? "Unfeature" : "Feature on homepage"} onClick={() => patch(d, { featured: String(!d.featured) })}>
                    <Star className={`w-4 h-4 ${d.featured ? "fill-ink" : ""}`} />
                  </IconBtn>
                  <IconBtn title="Edit" onClick={() => setEditing({ mode: "edit", design: d })}>
                    <Pencil className="w-4 h-4" />
                  </IconBtn>
                  <IconBtn title="Delete" onClick={() => remove(d)} danger>
                    <Trash2 className="w-4 h-4" />
                  </IconBtn>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <DesignForm
          key={editing.mode === "edit" ? editing.design.id : "new"}
          design={editing.mode === "edit" ? editing.design : undefined}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function IconBtn({ children, title, onClick, danger }: { children: React.ReactNode; title: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`p-1.5 rounded-lg transition-colors ${danger ? "text-red-600 hover:bg-red-50" : "hover:bg-paper"}`}
    >
      {children}
    </button>
  );
}

function DesignForm({
  design,
  categories,
  onClose,
  onSaved,
}: {
  design?: Design;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(design?.name ?? "");
  const [category, setCategory] = useState(design?.category ?? categories[0]?.slug ?? "");
  const [price, setPrice] = useState(String(design?.price ?? 199));
  const [description, setDescription] = useState(design?.description ?? "");
  const [featured, setFeatured] = useState(design?.featured ?? false);
  const [active, setActive] = useState(design?.active ?? true);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(design?.image ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pickFile = (f?: File) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!design && !file) return setError("Please choose an image.");
    setBusy(true);
    setError("");
    const fd = new FormData();
    fd.append("name", name);
    fd.append("category", category);
    fd.append("price", price);
    fd.append("description", description);
    fd.append("featured", String(featured));
    fd.append("active", String(active));
    if (file) fd.append("image", file);
    const res = await fetch(design ? `/api/admin/designs/${design.id}` : "/api/admin/designs", {
      method: design ? "PATCH" : "POST",
      body: fd,
    });
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || "Save failed.");
      setBusy(false);
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto bg-paper rounded-t-3xl sm:rounded-3xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold">{design ? "Edit design" : "New design"}</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-ink/5" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid sm:grid-cols-[220px_1fr] gap-6">
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              pickFile(e.dataTransfer.files[0]);
            }}
            className="aspect-square rounded-2xl border-2 border-dashed border-line bg-white flex flex-col items-center justify-center text-center cursor-pointer hover:border-ink overflow-hidden"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="w-full h-full object-contain p-3" />
            ) : (
              <>
                <ImagePlus className="w-7 h-7 text-muted" />
                <span className="text-sm font-medium mt-2">Upload artwork</span>
                <span className="text-xs text-muted mt-1 px-4">Transparent PNG, ≥2000px, max 10 MB</span>
              </>
            )}
            <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
          </label>

          <div className="space-y-4">
            <Field label="Name">
              <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="e.g. Tiger Face" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category">
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Design price (Rs.)">
                <input required type="number" min={0} step={1} value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} />
              </Field>
            </div>
            <p className="text-xs text-muted -mt-2">
              Added on top of the garment and print-location prices (set under Pricing). Use 0 for free designs.
            </p>
            <Field label="Description (optional)">
              <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputCls} resize-none`} />
            </Field>
            <div className="flex flex-wrap gap-4">
              <Toggle checked={active} onChange={setActive} label="Visible in store" />
              <Toggle checked={featured} onChange={setFeatured} label="Featured on homepage" />
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} className="px-5 py-3 rounded-full text-sm font-semibold hover:bg-ink/5">
            Cancel
          </button>
          <button
            disabled={busy}
            className="inline-flex items-center gap-2 bg-ink text-paper text-sm font-semibold px-6 py-3 rounded-full hover:bg-flame disabled:opacity-60"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {design ? "Save changes" : "Add design"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full p-0.5 transition-colors ${checked ? "bg-ink" : "bg-line"}`}
      >
        <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : ""}`} />
      </button>
      {label}
    </label>
  );
}
