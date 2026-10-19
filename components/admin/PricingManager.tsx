"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, ImagePlus, Loader2, Plus, RotateCcw, X } from "lucide-react";
import { COLORS, GARMENTS, formatPrice, type Pricing } from "@/lib/garments";
import type { GarmentColor } from "@/lib/types";
import { GUIDE, PANELS, PRINT_LOCATIONS, areaSize, type PrintLocation } from "@/lib/print-locations";
import { PageHeader, inputCls } from "@/components/admin/ui";

type GarmentRow = { label: string; fabric: string; image: string; price: string; visible: boolean; colors: GarmentColor[] };

const sameColors = (a: GarmentColor[], b: GarmentColor[]) =>
  a.length === b.length && a.every((c, i) => c.hex.toLowerCase() === b[i].hex.toLowerCase() && c.label === b[i].label);
type AreaRow = { price: string; visible: boolean };

/** Admin → Garments & print areas: visibility, prices, names, fabric lines, photos and colours. */
export default function PricingManager({ pricing }: { pricing: Pricing }) {
  const router = useRouter();
  const [garments, setGarments] = useState<Record<string, GarmentRow>>(() =>
    Object.fromEntries(
      GARMENTS.map((g) => [
        g.slug,
        {
          ...pricing.garmentInfo[g.slug],
          price: String(pricing.garment[g.slug]),
          visible: !pricing.hiddenGarments.includes(g.slug),
          colors: pricing.colors[g.slug],
        },
      ])
    )
  );
  const [areas, setAreas] = useState<Record<string, AreaRow>>(() =>
    Object.fromEntries(
      PRINT_LOCATIONS.map((l) => [
        l.id,
        { price: String(pricing.location[l.id]), visible: !pricing.hiddenLocations.includes(l.id) },
      ])
    )
  );
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);

  const patchGarment = (slug: string, patch: Partial<GarmentRow>) => {
    setGarments((s) => ({ ...s, [slug]: { ...s[slug], ...patch } }));
    setDirty(true);
  };
  const patchArea = (id: string, patch: Partial<AreaRow>) => {
    setAreas((s) => ({ ...s, [id]: { ...s[id], ...patch } }));
    setDirty(true);
  };

  const visibleGarmentCount = Object.values(garments).filter((g) => g.visible).length;
  const visibleAreaCount = Object.values(areas).filter((a) => a.visible).length;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("saving");
    setError("");
    const defaults = Object.fromEntries(GARMENTS.map((g) => [g.slug, g]));
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        garmentPrices: Object.fromEntries(Object.entries(garments).map(([k, v]) => [k, v.price])),
        locationPrices: Object.fromEntries(Object.entries(areas).map(([k, v]) => [k, v.price])),
        hiddenGarments: Object.entries(garments).filter(([, v]) => !v.visible).map(([k]) => k),
        hiddenLocations: Object.entries(areas).filter(([, v]) => !v.visible).map(([k]) => k),
        // Only store values that differ from the built-in defaults.
        garmentInfo: Object.fromEntries(
          Object.entries(garments).map(([k, v]) => [
            k,
            {
              label: v.label !== defaults[k].label ? v.label : "",
              fabric: v.fabric !== defaults[k].fabric ? v.fabric : "",
              image: v.image !== defaults[k].image ? v.image : "",
            },
          ])
        ),
        garmentColors: Object.fromEntries(Object.entries(garments).map(([k, v]) => [k, v.colors])),
      }),
    });
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || "Save failed.");
      setState("error");
      return;
    }
    setState("saved");
    setDirty(false);
    router.refresh();
    setTimeout(() => setState("idle"), 2000);
  };

  return (
    <form onSubmit={save}>
      <PageHeader
        title="Garments & print areas"
        sub="Hide anything you don't offer right now, set prices, and choose the colours each garment comes in. Price per shirt = garment + each print area used + any store design's price."
      >
        <button
          disabled={state === "saving" || !dirty}
          className="inline-flex items-center gap-2 bg-ink text-paper text-sm font-semibold px-5 py-3 rounded-full hover:bg-flame transition-colors disabled:opacity-40"
        >
          {state === "saving" ? <Loader2 className="w-4 h-4 animate-spin" /> : state === "saved" && <Check className="w-4 h-4" />}
          {state === "saved" ? "Saved" : "Save changes"}
        </button>
      </PageHeader>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {/* Garments */}
      <section className="rounded-3xl bg-white border border-line p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-3 mb-5">
          <h2 className="font-semibold">Garments</h2>
          <p className="text-xs text-muted">
            {visibleGarmentCount} of {GARMENTS.length} visible
          </p>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {GARMENTS.map((g) => (
            <GarmentCard
              key={g.slug}
              row={garments[g.slug]}
              defaults={g}
              lastVisible={garments[g.slug].visible && visibleGarmentCount === 1}
              onChange={(patch) => patchGarment(g.slug, patch)}
            />
          ))}
        </div>
      </section>

      {/* Print areas */}
      <section className="rounded-3xl bg-white border border-line p-5 sm:p-6 mt-6">
        <div className="flex items-baseline justify-between gap-3 mb-5">
          <h2 className="font-semibold">Print areas</h2>
          <p className="text-xs text-muted">
            {visibleAreaCount} of {PRINT_LOCATIONS.length} visible · each area is charged once per shirt
          </p>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {PRINT_LOCATIONS.map((l) => {
            const row = areas[l.id];
            const last = row.visible && visibleAreaCount === 1;
            return (
              <div key={l.id} className={`rounded-2xl border p-4 transition-opacity ${row.visible ? "border-line" : "border-dashed border-line opacity-60"}`}>
                <AreaDiagram loc={l} on={row.visible} />
                <div className="flex items-center justify-between gap-2 mt-3">
                  <div>
                    <p className="font-semibold text-sm">
                      {l.label} <span className="font-normal text-muted">· {areaSize(l)}</span>
                    </p>
                    <p className="text-xs text-muted">
                      {l.inches.w}″ × {l.inches.h}″ piece
                    </p>
                  </div>
                  <VisibilityToggle
                    on={row.visible}
                    disabled={last}
                    onChange={(visible) => patchArea(l.id, { visible })}
                  />
                </div>
                <PriceInput value={row.price} onChange={(price) => patchArea(l.id, { price })} />
                {last && <p className="text-[11px] text-muted mt-2">At least one print area must stay visible.</p>}
              </div>
            );
          })}
        </div>
        {!areas.front.visible && (
          <p className="text-xs text-muted mt-4">
            Front is hidden, so store designs will print on the {areas.back.visible ? "back" : "first visible area"} by default.
          </p>
        )}
      </section>
    </form>
  );
}

function GarmentCard({
  row,
  defaults,
  lastVisible,
  onChange,
}: {
  row: GarmentRow;
  defaults: (typeof GARMENTS)[number];
  lastVisible: boolean;
  onChange: (patch: Partial<GarmentRow>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  const upload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setErr("");
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const json = await res.json().catch(() => ({}));
    setUploading(false);
    if (!res.ok) return setErr(json.error || "Upload failed.");
    onChange({ image: json.url });
  };

  const changed =
    row.label !== defaults.label ||
    row.fabric !== defaults.fabric ||
    row.image !== defaults.image ||
    !sameColors(row.colors, COLORS);

  return (
    <div className={`rounded-2xl border overflow-hidden transition-opacity ${row.visible ? "border-line" : "border-dashed border-line opacity-60"}`}>
      <div className="relative aspect-4/3 bg-paper group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={row.image} alt={row.label} className={`w-full h-full object-cover ${row.visible ? "" : "grayscale"}`} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="absolute inset-0 flex items-center justify-center gap-2 bg-black/45 text-white text-sm font-semibold opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />} Change photo
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            upload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {!row.visible && (
          <span className="absolute top-2 left-2 rounded-full bg-ink text-paper text-[10px] font-semibold px-2 py-0.5">Hidden</span>
        )}
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <input
            value={row.label}
            onChange={(e) => onChange({ label: e.target.value })}
            className={`${inputCls} font-semibold`}
            aria-label="Garment name"
          />
          <VisibilityToggle on={row.visible} disabled={lastVisible} onChange={(visible) => onChange({ visible })} />
        </div>
        <input
          value={row.fabric}
          onChange={(e) => onChange({ fabric: e.target.value })}
          className={`${inputCls} text-xs`}
          aria-label="Fabric description"
        />
        <PriceInput value={row.price} onChange={(price) => onChange({ price })} />
        <ColorsEditor colors={row.colors} onChange={(colors) => onChange({ colors })} />
        <div className="flex items-center justify-between text-[11px] text-muted">
          <span>{lastVisible ? "At least one garment must stay visible." : err || " "}</span>
          {changed && (
            <button
              type="button"
              onClick={() => onChange({ label: defaults.label, fabric: defaults.fabric, image: defaults.image, colors: COLORS })}
              className="inline-flex items-center gap-1 hover:text-ink"
            >
              <RotateCcw className="w-3 h-3" /> Defaults
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** The colours a garment comes in: remove any, add from the standard palette or a custom one. */
function ColorsEditor({ colors, onChange }: { colors: GarmentColor[]; onChange: (c: GarmentColor[]) => void }) {
  const [hex, setHex] = useState("#c0392b");
  const [name, setName] = useState("");
  const has = (h: string) => colors.some((c) => c.hex.toLowerCase() === h.toLowerCase());
  const missing = COLORS.filter((c) => !has(c.hex));
  const addCustom = () => {
    if (!name.trim() || has(hex)) return;
    onChange([...colors, { hex, label: name.trim() }]);
    setName("");
  };

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted mb-2">Colours · {colors.length}</p>
      <div className="flex flex-wrap gap-1.5">
        {colors.map((c) => (
          <span key={c.hex} className="inline-flex items-center gap-1.5 rounded-full border border-line pl-1 pr-1.5 py-1 text-xs">
            <span className="w-4 h-4 rounded-full border border-black/15" style={{ background: c.hex }} />
            {c.label}
            <button
              type="button"
              onClick={() => onChange(colors.filter((x) => x.hex !== c.hex))}
              disabled={colors.length === 1}
              title={colors.length === 1 ? "Every garment needs at least one colour" : `Remove ${c.label}`}
              aria-label={`Remove ${c.label}`}
              className="text-muted hover:text-ink disabled:opacity-30"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      {missing.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className="text-[11px] text-muted">Add:</span>
          {missing.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => onChange([...colors, c])}
              title={`Add ${c.label}`}
              aria-label={`Add ${c.label}`}
              className="w-5 h-5 rounded-full border border-black/15 hover:scale-110 transition-transform"
              style={{ background: c.hex }}
            />
          ))}
        </div>
      )}
      <div className="flex items-center gap-1.5 mt-2">
        <input
          type="color"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          aria-label="Custom colour"
          className="w-8 h-8 shrink-0 rounded-lg border border-line bg-white p-0.5 cursor-pointer"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 30))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Custom colour name"
          aria-label="Custom colour name"
          className={`${inputCls} text-xs py-1.5`}
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!name.trim() || has(hex)}
          title={has(hex) ? "Already added" : "Add this colour"}
          className="shrink-0 w-8 h-8 rounded-lg bg-ink text-paper flex items-center justify-center disabled:opacity-30"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function VisibilityToggle({ on, disabled, onChange }: { on: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      title={disabled ? "At least one must stay visible" : on ? "Visible — click to hide" : "Hidden — click to show"}
      className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${
        on ? "bg-ink text-paper" : "bg-paper text-muted hover:text-ink"
      }`}
    >
      {on ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
      {on ? "Visible" : "Hidden"}
    </button>
  );
}

function PriceInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="relative block">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted">Rs.</span>
      <input
        type="number"
        min={0}
        step={1}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} pl-11`}
        aria-label="Price"
      />
      {value !== "" && (
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-muted pointer-events-none">
          {formatPrice(Number(value) || 0)}
        </span>
      )}
    </label>
  );
}

/** The flat pattern with this area's box highlighted. */
function AreaDiagram({ loc, on }: { loc: PrintLocation; on: boolean }) {
  const { x, y, w, h } = loc.rect;
  return (
    <svg viewBox={`0 0 ${GUIDE.w} ${GUIDE.h}`} className="w-full aspect-square bg-paper rounded-xl" aria-hidden>
      {PANELS.map((p) => (
        <path key={p.id} d={p.outline} fill="#ffffff" stroke="#11111133" strokeWidth="5" strokeLinejoin="round" />
      ))}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill={on ? "#d4ff3a" : "#cbd5e1"}
        stroke="#111111"
        strokeWidth="5"
        strokeDasharray="14 9"
      />
    </svg>
  );
}
