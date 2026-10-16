"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Images,
  Upload,
  Type,
  Trash2,
  ShoppingBag,
  Check,
  Loader2,
  Minus,
  Plus,
  Search,
  RotateCw,
  Crosshair,
  Copy,
  Pencil,
  AlertTriangle,
} from "lucide-react";
import type { Category, Design, PrintPlacement, PrintSpec } from "@/lib/types";
import {
  COLORS,
  SIZES,
  colorLabel,
  formatPrice,
  garmentFor,
  visibleGarments,
  visibleLocations,
  type Pricing,
} from "@/lib/garments";
import {
  AREA_FOR_VIEW,
  FIXED_PRINT_SPEC,
  areaSize,
  describePlacement,
  fitInside,
  fixedPrintFor,
  getLocation,
  newPlacement,
  toGuideBox,
  toPlacement,
  type GuideBox,
  type PrintLocation,
  type PrintView,
} from "@/lib/print-locations";
import { useCart } from "@/lib/cart-context";
import { SizeChartButton } from "@/components/SizeChart";
import PositionGuide from "@/components/PositionGuide";
import { PrintAreasLegend } from "@/components/PrintAreas";

const TShirtViewer = dynamic(() => import("@/components/TShirtViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-sm opacity-60">Loading 3D preview…</div>
  ),
});

type Tab = "store" | "upload" | "text";

type Art =
  | { type: "gallery"; designId: string }
  | { type: "upload"; src: string; name: string }
  | { type: "text"; src: string; text: string; fontId: string; color: string; rendered: string };

/** A design on the garment: artwork, the print area it's in and its box on the position guide. */
type Layer = Art & { id: string; area: string; box: GuideBox; aspect: number };

/** Keeps a layer inside its print area (after its size, shape or rotation changes). */
function refit<T extends Layer>(l: T): T {
  const area = getLocation(l.area);
  return area ? { ...l, box: fitInside(l.box, l.aspect, area.rect) } : l;
}

const TEXT_FONTS = [
  { id: "display", label: "Display", css: () => cssVarFont("--font-bricolage"), weight: 800, preview: "var(--font-bricolage)" },
  { id: "sans", label: "Sans", css: () => cssVarFont("--font-inter"), weight: 700, preview: "var(--font-inter)" },
  { id: "impact", label: "Impact", css: () => "Impact, 'Arial Black', sans-serif", weight: 400, preview: "Impact, sans-serif" },
  { id: "serif", label: "Serif", css: () => "Georgia, 'Times New Roman', serif", weight: 700, preview: "Georgia, serif" },
  { id: "mono", label: "Mono", css: () => "'Courier New', monospace", weight: 700, preview: "'Courier New', monospace" },
];
const TEXT_COLORS = ["#121212", "#ffffff", "#ff5b1f", "#d4ff3a", "#1E334D", "#c1121f", "#f2c14e"];

function cssVarFont(name: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || "sans-serif";
}

const textKey = (a: { text: string; fontId: string; color: string }) => `${a.fontId}|${a.color}|${a.text}`;

/** Renders text to a transparent PNG cropped tightly around the text. */
function renderText(text: string, fontId: string, color: string) {
  const font = TEXT_FONTS.find((f) => f.id === fontId) ?? TEXT_FONTS[0];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 4);
  if (!lines.length) return null;
  const fontSize = 220;
  const lh = fontSize * 1.1;
  const pad = fontSize * 0.15;
  const css = `${font.weight} ${fontSize}px ${font.css()}`;
  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = css;
  const widest = Math.max(...lines.map((l) => measure.measureText(l).width));
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(widest + pad * 2);
  canvas.height = Math.ceil(lh * lines.length + pad * 2);
  const ctx = canvas.getContext("2d")!;
  ctx.font = css;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  lines.forEach((l, i) => ctx.fillText(l, canvas.width / 2, pad + lh * (i + 0.5)));
  return { src: canvas.toDataURL("image/png"), aspect: canvas.width / canvas.height };
}

/** Normalises any uploaded image (incl. SVG) to a PNG data URL, max 2048px. */
function fileToPng(file: File): Promise<{ src: string; aspect: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 2048;
      const w = img.naturalWidth || 1024;
      const h = img.naturalHeight || 1024;
      const s = Math.min(1, max / Math.max(w, h));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(w * s);
      canvas.height = Math.round(h * s);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve({ src: canvas.toDataURL("image/png"), aspect: canvas.width / canvas.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file couldn't be read as an image."));
    };
    img.src = url;
  });
}

async function uploadImage(dataUrl: string, kind: "artwork" | "preview") {
  const res = await fetch("/api/artwork", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl, kind }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Upload failed");
  return json.url as string;
}

let nextId = 1;
const newId = () => `L${Date.now().toString(36)}${nextId++}`;

export default function CustomizeStudio({
  categories,
  designs,
  pricing,
}: {
  categories: Category[];
  designs: Design[];
  pricing: Pricing;
}) {
  const params = useSearchParams();
  const { addItem } = useCart();

  const initialDesign = designs.find((d) => d.slug === params.get("design") || d.id === params.get("design"));
  const mode = params.get("mode");

  // Only garments and print areas the admin has enabled.
  const garments = visibleGarments(pricing);
  const locations = visibleLocations(pricing);
  const fixedPrint = fixedPrintFor(locations.map((l) => l.id));

  const [garment, setGarment] = useState(garmentFor(pricing, params.get("garment")).slug);
  const [color, setColor] = useState(() => {
    const c = params.get("color");
    return c && COLORS.some((x) => x.hex === c) ? c : COLORS[0].hex;
  });
  const [size, setSize] = useState(SIZES.includes(params.get("size") || "") ? params.get("size")! : "M");
  const [qty, setQty] = useState(1);

  // Store designs start at the fixed print spot; the editor is optional.
  const [layers, setLayers] = useState<Layer[]>(() =>
    initialDesign
      ? [
          {
            id: newId(),
            type: "gallery",
            designId: initialDesign.id,
            area: fixedPrint.location,
            aspect: 1,
            box: toGuideBox(getLocation(fixedPrint.location)!, fixedPrint.placement),
          },
        ]
      : []
  );
  const [editorOpen, setEditorOpen] = useState(!initialDesign);

  // The store design's real shape isn't known until its image loads. Once it
  // does, re-place it so its top edge sits exactly at the fixed spot — unless
  // the customer has already moved it.
  const initialBox = useRef(layers[0]?.box);
  // The 3D preview holds the store design back until its real shape is
  // known, so it's drawn once at its final size instead of jumping.
  const [shapeKnown, setShapeKnown] = useState(!initialDesign);
  useEffect(() => {
    if (!initialDesign) return;
    const img = new Image();
    img.onerror = () => setShapeKnown(true);
    img.onload = () => {
      setShapeKnown(true);
      if (!img.naturalWidth || !img.naturalHeight) return;
      const aspect = img.naturalWidth / img.naturalHeight;
      setLayers((prev) =>
        prev.map((l) => {
          if (l.type !== "gallery" || l.designId !== initialDesign.id) return l;
          if (l.box !== initialBox.current) return refit({ ...l, aspect });
          const spot = fixedPrintFor(locations.map((x) => x.id), aspect);
          const box = toGuideBox(getLocation(spot.location)!, spot.placement);
          initialBox.current = box;
          return { ...l, aspect, area: spot.location, box };
        })
      );
    };
    img.src = initialDesign.image;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [selected, setSelected] = useState<string | null>(layers[0]?.id ?? null);
  const [tab, setTab] = useState<Tab>(mode === "upload" ? "upload" : mode === "text" ? "text" : "store");
  const [view, setView] = useState<{ name: PrintView; n: number }>({ name: "front", n: 0 });

  const [storeCat, setStoreCat] = useState(initialDesign?.category ?? "all");
  const [storeQuery, setStoreQuery] = useState("");
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<"idle" | "adding" | "added" | "error">("idle");
  const [error, setError] = useState("");
  const viewerRef = useRef<HTMLDivElement>(null);
  const uploadedUrls = useRef(new Map<string, string>()); // data URL → stored file URL

  const g = garmentFor(pricing, garment);
  const designById = (id: string) => designs.find((d) => d.id === id);
  const srcOf = (l: Art) => (l.type === "gallery" ? designById(l.designId)?.image ?? "" : l.src);
  const nameOf = (l: Art) =>
    l.type === "gallery"
      ? designById(l.designId)?.name ?? "Design"
      : l.type === "upload"
        ? `Your upload (${l.name})`
        : `Text: “${l.text.trim().replace(/\n/g, " / ")}”`;
  const designPriceOf = (l: Art) => (l.type === "gallery" ? designById(l.designId)?.price ?? 0 : 0);

  // Which piece each design is on, and its placement relative to that piece.
  const placed = useMemo(
    () =>
      layers.map((layer) => {
        // Only areas the admin still offers print.
        const loc = locations.find((l) => l.id === layer.area);
        return { layer, loc, placement: loc ? toPlacement(loc, layer.box) : null };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layers, pricing]
  );
  const printed = placed.filter((p): p is { layer: Layer; loc: PrintLocation; placement: PrintPlacement } => !!p.loc);
  const offGarment = placed.length - printed.length;

  const areasUsed = locations.filter((l) => printed.some((p) => p.loc.id === l.id));
  const designFees = printed.reduce((s, p) => s + designPriceOf(p.layer), 0);
  const unitPrice =
    pricing.garment[g.slug] + areasUsed.reduce((s, l) => s + pricing.location[l.id], 0) + designFees;

  // Re-projecting decals onto the 3D model is heavy, so while the customer
  // drags on the guide the 3D preview catches up a few times a second.
  const throttled = useThrottled(printed, 120);
  const viewerPrints = useMemo(
    () =>
      throttled
        .map((p) => ({ id: p.layer.id, location: p.loc.id, src: srcOf(p.layer), placement: p.placement }))
        .filter((p) => p.src && shapeKnown),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [throttled, shapeKnown]
  );

  // Cover the 3D view until the shirt and the design are fully loaded, so
  // half-loaded states never show. Gives up after 12s so it can't get stuck.
  const [previewReady, setPreviewReady] = useState(false);
  const markPreviewReady = useCallback(() => setPreviewReady(true), []);
  useEffect(() => {
    const t = setTimeout(() => setPreviewReady(true), 12000);
    return () => clearTimeout(t);
  }, []);
  const waitingForPrint = !shapeKnown || (!!initialDesign && layers.length > 0 && viewerPrints.length === 0);
  const guideLayers = layers.map((l) => ({ id: l.id, src: srcOf(l), box: l.box, aspect: l.aspect, area: l.area }));

  const sel = layers.find((l) => l.id === selected) ?? null;
  const selPiece = sel ? locations.find((l) => l.id === sel.area) : undefined;

  const focus = (v: PrintView) => setView((cur) => ({ name: v, n: cur.n + 1 }));

  // Every change keeps the design inside its print area.
  const updateLayer = (id: string, patch: Partial<Layer>) =>
    setLayers((prev) => prev.map((l) => (l.id === id ? refit({ ...l, ...patch } as Layer) : l)));

  /** Moves a design to another print area, sized to fit it. */
  const moveToArea = (l: Layer, loc: PrintLocation) => {
    if (l.area === loc.id) return;
    updateLayer(l.id, { area: loc.id, box: toGuideBox(loc, newPlacement(loc, l.aspect)) });
    if (loc.view !== view.name) focus(loc.view);
  };

  /** Adds a design to the main print area of the side the 3D view is facing. */
  const addLayer = (art: Art, aspect = 1) => {
    // That side's main area, or the first enabled area if it's hidden.
    const loc = locations.find((l) => l.id === AREA_FOR_VIEW[view.name]) ?? locations[0];
    const layer = { ...art, id: newId(), area: loc.id, aspect, box: toGuideBox(loc, newPlacement(loc, aspect)) } as Layer;
    setLayers((prev) => [...prev, layer]);
    setSelected(layer.id);
  };

  const removeLayer = (id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id));
    if (selected === id) setSelected(null);
  };

  const duplicateLayer = (l: Layer) => {
    const nudge = (getLocation(l.area)?.rect.w ?? 200) * 0.08;
    const copy = refit({ ...l, id: newId(), box: { ...l.box, cx: l.box.cx + nudge, cy: l.box.cy + nudge } } as Layer);
    setLayers((prev) => [...prev, copy]);
    setSelected(copy.id);
  };

  const selectLayer = (id: string | null) => {
    setSelected(id);
    const l = layers.find((x) => x.id === id);
    const loc = l && getLocation(l.area);
    if (loc && loc.view !== view.name) focus(loc.view);
    if (l?.type === "text") setTab("text");
  };

  // Re-render text designs shortly after their text, font or colour changes.
  const textSig = layers.map((l) => (l.type === "text" ? `${l.id}:${textKey(l)}` : "")).join(",");
  useEffect(() => {
    const stale = layers.filter(
      (l): l is Extract<Layer, { type: "text" }> => l.type === "text" && l.rendered !== textKey(l)
    );
    if (!stale.length) return;
    const t = setTimeout(() => {
      const results = new Map(stale.map((l) => [l.id, { key: textKey(l), out: renderText(l.text, l.fontId, l.color) }]));
      setLayers((prev) =>
        prev.map((l) => {
          const r = results.get(l.id);
          if (!r || l.type !== "text" || textKey(l) !== r.key) return l;
          return r.out ? refit({ ...l, src: r.out.src, aspect: r.out.aspect, rendered: r.key }) : { ...l, rendered: r.key };
        })
      );
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textSig]);

  const addText = (initial = "YOUR TEXT") => {
    const dark = ["#1f1f1f", "#1E334D", "#662735", "#476748", "#6F7573"].includes(color);
    const textColor = dark ? "#ffffff" : "#121212";
    const out = renderText(initial, TEXT_FONTS[0].id, textColor);
    if (!out) return;
    addLayer(
      { type: "text", src: out.src, text: initial, fontId: TEXT_FONTS[0].id, color: textColor, rendered: "" },
      out.aspect
    );
  };

  // ?mode=text&text=… (from the homepage playground) starts with that text on the front.
  const startText = useRef(mode === "text" ? params.get("text")?.slice(0, 80) : null);
  useEffect(() => {
    if (!startText.current) return;
    const t = startText.current;
    startText.current = null;
    addText(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFile = async (file?: File) => {
    if (!file) return;
    setUploadError("");
    if (file.size > 15 * 1024 * 1024) return setUploadError("Please choose an image under 15 MB.");
    try {
      const { src, aspect } = await fileToPng(file);
      addLayer({ type: "upload", src, name: file.name }, aspect);
    } catch (e) {
      setUploadError((e as Error).message);
    }
  };

  // Full-page editor: lock page scroll; Delete removes the selected design.
  useEffect(() => {
    if (!editorOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [editorOpen]);

  useEffect(() => {
    if (!editorOpen || !selected) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, select")) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        removeLayer(selected);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorOpen, selected]);

  const handleAdd = async () => {
    setStatus("adding");
    setError("");
    try {
      const charged = new Set<string>();
      const specs: PrintSpec[] = [];
      for (const { layer, loc, placement } of printed) {
        let artworkUrl: string;
        if (layer.type === "gallery") {
          artworkUrl = designById(layer.designId)!.image;
        } else {
          artworkUrl = uploadedUrls.current.get(layer.src) ?? (await uploadImage(layer.src, "artwork"));
          uploadedUrls.current.set(layer.src, artworkUrl);
        }
        const areaFee = charged.has(loc.id) ? 0 : pricing.location[loc.id];
        charged.add(loc.id);
        specs.push({
          location: loc.id,
          placement,
          aspect: layer.aspect,
          designType: layer.type,
          designId: layer.type === "gallery" ? layer.designId : undefined,
          designName: nameOf(layer),
          artworkUrl,
          price: areaFee + designPriceOf(layer),
          v: 2,
        });
      }
      let previewUrl: string | undefined;
      const canvas = viewerRef.current?.querySelector("canvas");
      if (canvas) {
        try {
          previewUrl = await uploadImage(canvas.toDataURL("image/webp", 0.85), "preview");
        } catch {
          // the preview is a nice-to-have
        }
      }
      addItem({
        garment: g.slug,
        garmentLabel: g.label,
        color,
        colorLabel: colorLabel(color),
        size,
        qty,
        unitPrice,
        prints: specs,
        previewUrl,
      });
      setStatus("added");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (e) {
      setError((e as Error).message || "Something went wrong — please try again.");
      setStatus("error");
    }
  };

  const fixed = printed.length === 1 && layers.length === 1 ? printed[0] : null;
  const fixedSpot = fixed ? fixedPrintFor(locations.map((l) => l.id), fixed.layer.aspect) : fixedPrint;
  const isFixedStorePrint =
    !!fixed &&
    fixed.layer.type === "gallery" &&
    fixed.loc.id === fixedSpot.location &&
    Math.abs(fixed.placement.x - fixedSpot.placement.x) < 1e-6 &&
    Math.abs(fixed.placement.y - fixedSpot.placement.y) < 1e-6 &&
    Math.abs(fixed.placement.w - fixedSpot.placement.w) < 1e-6 &&
    fixed.placement.rotation === 0;

  const addButton = (
    <button
      onClick={handleAdd}
      disabled={status === "adding"}
      className="flex items-center justify-center gap-2 bg-lime text-ink font-semibold px-6 py-3.5 rounded-full hover:bg-white transition-colors disabled:opacity-60"
    >
      {status === "adding" ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" /> Adding…
        </>
      ) : status === "added" ? (
        <>
          <Check className="w-4 h-4" /> Added to cart
        </>
      ) : (
        <>
          <ShoppingBag className="w-4 h-4" /> Add to cart · {formatPrice(unitPrice * qty)}
        </>
      )}
    </button>
  );

  const viewer = (dark: boolean) => (
    <div ref={viewerRef} className="absolute inset-0">
      <TShirtViewer
        color={color}
        prints={viewerPrints}
        view={view.name}
        viewNonce={view.n}
        autoRotate={false}
        onReady={waitingForPrint ? undefined : markPreviewReady}
      />
      <PreviewCover dark={dark} hidden={previewReady} />
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5">
        {(
          [
            ["front", "Front"],
            ["back", "Back"],
            ["left", "Left"],
            ["right", "Right"],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            onClick={() => focus(v)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              view.name === v
                ? dark
                  ? "bg-paper text-ink border-paper"
                  : "bg-ink text-paper border-ink"
                : dark
                  ? "bg-white/5 border-white/15 hover:border-white/50"
                  : "bg-white/90 border-line hover:border-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );

  const options = (
    <>
      <Section title="Garment">
        <div className="grid grid-cols-2 gap-2">
          {garments.map((x) => (
            <button
              key={x.slug}
              onClick={() => setGarment(x.slug)}
              className={`text-left rounded-xl border px-3 py-2.5 transition-colors ${
                garment === x.slug ? "border-ink bg-ink text-paper" : "border-line bg-white hover:border-ink/40"
              }`}
            >
              <p className="text-sm font-semibold">{x.label}</p>
              <p className={`text-xs ${garment === x.slug ? "text-paper/60" : "text-muted"}`}>
                {formatPrice(pricing.garment[x.slug])}
              </p>
            </button>
          ))}
        </div>
      </Section>
      <Section title={`Colour · ${colorLabel(color)}`}>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c.hex}
              onClick={() => setColor(c.hex)}
              title={c.label}
              aria-label={c.label}
              className={`w-8 h-8 rounded-full border transition-transform ${
                color === c.hex ? "ring-2 ring-ink ring-offset-2 scale-105" : "border-black/15 hover:scale-105"
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </Section>
      <Section title="Size & quantity">
        <div className="-mt-1 mb-2.5">
          <SizeChartButton garments={garments} garment={garment} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`w-11 h-10 rounded-xl text-sm font-semibold border transition-colors ${
                size === s ? "bg-ink text-paper border-ink" : "bg-white border-line hover:border-ink/40"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="inline-flex items-center border border-line rounded-full mt-3 bg-white">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-2" aria-label="Decrease quantity">
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-8 text-center font-semibold text-sm">{qty}</span>
          <button onClick={() => setQty((q) => Math.min(500, q + 1))} className="p-2" aria-label="Increase quantity">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </Section>
    </>
  );

  const priceLines = (
    <div className="space-y-1.5 text-sm">
      <Row label={g.label} value={formatPrice(pricing.garment[g.slug])} />
      {areasUsed.map((l) => (
        <Row key={l.id} label={`${l.label} print`} value={`+${formatPrice(pricing.location[l.id])}`} />
      ))}
      {printed
        .filter((p) => designPriceOf(p.layer) > 0)
        .map((p) => (
          <Row key={p.layer.id} label={`Design: ${nameOf(p.layer)}`} value={`+${formatPrice(designPriceOf(p.layer))}`} />
        ))}
    </div>
  );

  // ── Product view: store design at its fixed spot (or a summary) ─────────
  if (!editorOpen) {
    const single = isFixedStorePrint && fixed!.layer.type === "gallery" ? designById(fixed!.layer.designId) : null;
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-8 items-start">
          <div className="relative rounded-[2rem] bg-white border border-line overflow-hidden h-[460px] sm:h-[600px] lg:sticky lg:top-24">
            <div className="absolute inset-0 grain opacity-60 pointer-events-none" />
            {viewer(false)}
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                {single ? categories.find((c) => c.slug === single.category)?.name ?? "Design" : "Your design"}
              </p>
              <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mt-1">
                {single ? single.name : layers.length ? "Custom tee" : "Design your own"}
              </h1>
              {single?.description && <p className="text-muted mt-3">{single.description}</p>}
              <p className="font-display text-3xl font-bold mt-4">{formatPrice(unitPrice)}</p>
            </div>

            <div className="rounded-2xl bg-white border border-line p-4 text-sm">
              {single ? (
                <p>
                  <span className="font-semibold">Print:</span>{" "}
                  {fixedSpot.location === "front" || fixedSpot.location === "back"
                    ? `${getLocation(fixedSpot.location)?.label.toLowerCase()} (${areaSize(getLocation(fixedSpot.location)!)} area), ${(fixedSpot.placement.w * (getLocation(fixedSpot.location)?.inches.w ?? 11)).toFixed(1)}″ wide, centred, top edge ${FIXED_PRINT_SPEC.topIn}″ below the shoulder line.`
                    : `${getLocation(fixedSpot.location)?.label.toLowerCase()}, centred.`}
                </p>
              ) : printed.length ? (
                <ul className="space-y-1">
                  {printed.map((p) => (
                    <li key={p.layer.id} className="truncate">
                      <span className="font-semibold">{p.loc.label}:</span> {nameOf(p.layer)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No designs yet.</p>
              )}
              <button
                onClick={() => setEditorOpen(true)}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold border-b-2 border-ink pb-0.5 hover:text-flame hover:border-flame"
              >
                <Pencil className="w-3.5 h-3.5" />
                {single ? "Customize — move it, resize it, add text or more prints" : "Open the editor"}
              </button>
            </div>

            <details className="group rounded-2xl bg-white border border-line">
              <summary className="flex items-center justify-between gap-3 cursor-pointer list-none p-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                Where can I print? Print areas & sizes
                <Plus className="w-4 h-4 shrink-0 transition-transform group-open:rotate-45" />
              </summary>
              <div className="px-4 pb-4 space-y-4">
                <div className="rounded-xl bg-paper p-3">
                  <PositionGuide readOnly locations={locations} color={color} layers={guideLayers} />
                </div>
                <PrintAreasLegend locations={locations} prices={pricing.location} used={areasUsed.map((l) => l.id)} />
                <p className="text-xs text-muted">
                  Sizes are the largest print for each area and fit adult sizes S–2XL. Each area you use is charged
                  once per shirt.
                </p>
              </div>
            </details>

            <div className="space-y-5">{options}</div>

            <div className="rounded-3xl bg-ink text-paper p-6">
              <div className="text-paper/70">{priceLines}</div>
              <div className="mt-5 pt-5 border-t border-paper/10 flex flex-col">{addButton}</div>
              {error && <p className="text-xs text-red-300 mt-3 text-center">{error}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Full-page editor ────────────────────────────────────────────────────
  const selDesignPrice = sel ? designPriceOf(sel) : 0;
  const storeList = designs.filter(
    (d) =>
      (storeCat === "all" || d.category === storeCat) &&
      (!storeQuery || d.name.toLowerCase().includes(storeQuery.toLowerCase()))
  );
  const viewing = view.name === "left" || view.name === "right" ? `${view.name} sleeve` : view.name;

  return (
    <div className="fixed inset-0 z-45 bg-[#141414] text-paper flex flex-col">
      {/* Top bar */}
      <header className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 h-16 border-b border-white/10">
        <button
          onClick={() => setEditorOpen(false)}
          className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-full hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4" /> Done
        </button>
        <p className="hidden md:block font-display text-lg font-bold">
          Rad<span className="text-flame">.</span>Clo Studio
        </p>
        <div className="flex items-center gap-3">
          {offGarment > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5" /> {offGarment} in an area we no longer print
            </span>
          )}
          {addButton}
        </div>
      </header>
      {error && <p className="text-xs text-red-300 text-center py-1">{error}</p>}

      <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden grid lg:grid-cols-[320px_1fr_minmax(380px,460px)]">
        {/* Tools */}
        <aside className="order-3 lg:order-1 bg-paper text-ink lg:overflow-y-auto p-5 space-y-6">
          <Section title="Add a design">
            <div className="grid grid-cols-3 gap-1 p-1 bg-white border border-line rounded-full mb-4">
              {(
                [
                  ["store", "Store", Images],
                  ["upload", "Upload", Upload],
                  ["text", "Text", Type],
                ] as const
              ).map(([m, label, Icon]) => (
                <button
                  key={m}
                  onClick={() => setTab(m)}
                  className={`flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold transition-colors ${
                    tab === m ? "bg-ink text-paper" : "hover:bg-ink/5"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>

            {tab === "store" && (
              <div>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    value={storeQuery}
                    onChange={(e) => setStoreQuery(e.target.value)}
                    placeholder="Search designs"
                    className="w-full rounded-full border border-line bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-ink"
                  />
                </div>
                <div className="flex gap-1 overflow-x-auto pb-2 mb-1">
                  {[{ slug: "all", name: "All" }, ...categories].map((c) => (
                    <button
                      key={c.slug}
                      onClick={() => setStoreCat(c.slug)}
                      className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                        storeCat === c.slug ? "bg-ink text-paper" : "bg-white border border-line"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-1.5 max-h-72 overflow-y-auto">
                  {storeList.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => addLayer({ type: "gallery", designId: d.id })}
                      title={`Add ${d.name}`}
                      className="relative aspect-square rounded-lg border border-line bg-white p-1.5 hover:border-ink"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={d.image} alt={d.name} className="w-full h-full object-contain" loading="lazy" />
                      {d.price > 0 && (
                        <span className="absolute bottom-0.5 right-0.5 text-[9px] font-semibold bg-ink text-paper rounded-full px-1 py-px">
                          +{formatPrice(d.price)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted mt-2">Click a design to add it to the {viewing} you&apos;re viewing.</p>
              </div>
            )}

            {tab === "upload" && (
              <div>
                <button
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFile(e.dataTransfer.files[0]);
                  }}
                  className="w-full border-2 border-dashed border-line rounded-2xl p-5 text-center hover:border-ink bg-white"
                >
                  <Upload className="w-5 h-5 mx-auto text-muted mb-2" />
                  <p className="text-sm font-semibold">Drop artwork or click to upload</p>
                  <p className="text-xs text-muted mt-1">PNG, JPG, WEBP or SVG · transparent PNG works best</p>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    handleFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                {uploadError && <p className="text-xs text-red-600 mt-2">{uploadError}</p>}
                <p className="text-[11px] text-muted mt-2">It&apos;s added to the {viewing} you&apos;re viewing.</p>
              </div>
            )}

            {tab === "text" && (
              <div className="space-y-3">
                {sel?.type === "text" ? (
                  <>
                    <textarea
                      value={sel.text}
                      onChange={(e) => updateLayer(sel.id, { text: e.target.value.slice(0, 80) })}
                      rows={2}
                      className="w-full rounded-xl border border-line bg-white px-3 py-2 font-semibold focus:outline-none focus:border-ink resize-none"
                    />
                    <div className="flex gap-1 flex-wrap">
                      {TEXT_FONTS.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => updateLayer(sel.id, { fontId: f.id })}
                          className={`px-3 py-1.5 rounded-full text-sm border ${
                            sel.fontId === f.id ? "bg-ink text-paper border-ink" : "bg-white border-line"
                          }`}
                          style={{ fontFamily: f.preview }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      {TEXT_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => updateLayer(sel.id, { color: c })}
                          aria-label={`Text colour ${c}`}
                          className={`w-7 h-7 rounded-full border border-black/15 ${sel.color === c ? "ring-2 ring-ink ring-offset-2" : ""}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted">Select a text design on the guide to edit it, or add a new one.</p>
                )}
                <button
                  onClick={() => addText()}
                  className="w-full flex items-center justify-center gap-1.5 bg-ink text-paper text-sm font-semibold py-2.5 rounded-full hover:bg-flame"
                >
                  <Plus className="w-4 h-4" /> Add text
                </button>
              </div>
            )}
          </Section>

          {layers.length > 0 && (
            <Section title={`Your designs (${layers.length})`}>
              <ul className="space-y-1.5">
                {placed.map(({ layer, loc }) => (
                  <li key={layer.id}>
                    <div
                      className={`flex items-center gap-2.5 rounded-xl border p-1.5 pr-2 ${
                        selected === layer.id ? "border-ink bg-white" : "border-line bg-white/60"
                      }`}
                    >
                      <button onClick={() => selectLayer(layer.id)} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={srcOf(layer)} alt="" className="w-9 h-9 rounded-lg object-contain bg-paper p-0.5 shrink-0" />
                        <span className="min-w-0">
                          <span className="block text-xs font-semibold truncate">{nameOf(layer)}</span>
                          <span className={`block text-[11px] ${loc ? "text-muted" : "text-red-600"}`}>
                            {loc ? `${loc.label} · ${areaSize(loc)}` : "This print area isn't offered — move it"}
                          </span>
                        </span>
                      </button>
                      <button onClick={() => removeLayer(layer.id)} className="p-1 text-muted hover:text-red-600" aria-label="Remove design">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {options}

          <div className="rounded-2xl bg-white border border-line p-4">{priceLines}</div>
        </aside>

        {/* 3D */}
        <section className="order-1 lg:order-2 relative h-[48vh] lg:h-auto min-h-80">{viewer(true)}</section>

        {/* Position guide */}
        <aside className="order-2 lg:order-3 bg-white text-ink lg:overflow-y-auto p-5">
          <p className="text-center text-xs font-bold uppercase tracking-[0.25em] text-muted mb-4">Position guide</p>
          <PositionGuide
            locations={locations}
            color={color}
            layers={guideLayers}
            activeArea={selPiece?.id}
            selected={selected}
            onSelect={selectLayer}
            onChange={(id, box) => updateLayer(id, { box })}
            onAspect={(id, aspect) =>
              setLayers((prev) =>
                prev.map((l) => (l.id === id && Math.abs(l.aspect - aspect) > 0.001 ? refit({ ...l, aspect } as Layer) : l))
              )
            }
          />
          <p className="text-[11px] text-muted text-center mt-3">
            Designs stay inside their dashed print area · drag to move · corners to resize · top handle to rotate
          </p>

          {sel ? (
            <div className="mt-5 pt-5 border-t border-line space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{nameOf(sel)}</p>
                  <p className="text-xs text-muted">
                    {selPiece
                      ? `${selPiece.label} (${areaSize(selPiece)}) · ${describePlacement(selPiece, toPlacement(selPiece, sel.box), sel.aspect)}`
                      : "We no longer print on this area — pick another one below."}
                  </p>
                  {selDesignPrice > 0 && <p className="text-xs text-muted">Design price +{formatPrice(selDesignPrice)}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <IconBtn
                    label="Centre in this print area"
                    onClick={() =>
                      selPiece && updateLayer(sel.id, { box: { ...sel.box, cx: selPiece.rect.x + selPiece.rect.w / 2 } })
                    }
                  >
                    <Crosshair className="w-4 h-4" />
                  </IconBtn>
                  <IconBtn label="Duplicate" onClick={() => duplicateLayer(sel)}>
                    <Copy className="w-4 h-4" />
                  </IconBtn>
                  <IconBtn label="Remove" onClick={() => removeLayer(sel.id)} danger>
                    <Trash2 className="w-4 h-4" />
                  </IconBtn>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted mb-1.5">Print area</p>
                <div className="flex flex-wrap gap-1.5">
                  {locations.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => moveToArea(sel, l)}
                      className={`px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                        sel.area === l.id ? "bg-ink text-paper border-ink" : "bg-white border-line hover:border-ink/40"
                      }`}
                    >
                      {l.label} <span className="opacity-60 font-normal">{areaSize(l)}</span>
                    </button>
                  ))}
                </div>
              </div>
              {selPiece && (
                <Slider
                  label={`Width · ${((sel.box.w / selPiece.rect.w) * selPiece.inches.w).toFixed(1)}″ (max ${selPiece.inches.w}″)`}
                  value={sel.box.w}
                  min={Math.min(8, selPiece.rect.w / 6)}
                  max={fitInside({ ...sel.box, w: Infinity }, sel.aspect, selPiece.rect).w}
                  step={0.5}
                  onChange={(w) => updateLayer(sel.id, { box: { ...sel.box, w } })}
                />
              )}
              <Slider
                label={`Rotation · ${Math.round((sel.box.rotation * 180) / Math.PI)}°`}
                icon={<RotateCw className="w-3.5 h-3.5" />}
                value={sel.box.rotation}
                min={-Math.PI}
                max={Math.PI}
                step={Math.PI / 180}
                onChange={(rotation) => updateLayer(sel.id, { box: { ...sel.box, rotation } })}
              />
            </div>
          ) : (
            <p className="mt-5 pt-5 border-t border-line text-sm text-muted text-center">
              {layers.length ? "Select a design on the guide to adjust it." : "Add a design from the left panel to get started."}
            </p>
          )}

          <div className="mt-5 pt-5 border-t border-line">
            <p className="text-xs font-bold uppercase tracking-widest text-muted mb-2.5">Print areas & sizes</p>
            <PrintAreasLegend locations={locations} prices={pricing.location} used={areasUsed.map((l) => l.id)} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted mb-2.5">{title}</h2>
      {children}
    </section>
  );
}

function IconBtn({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`p-2 rounded-lg border border-line ${danger ? "text-red-600 hover:bg-red-50" : "hover:bg-paper"}`}
    >
      {children}
    </button>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  icon,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  icon?: React.ReactNode;
}) {
  return (
    <label className="block text-xs text-muted">
      <span className="font-medium flex items-center gap-1.5 mb-1">
        {icon}
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-ink"
      />
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="truncate">{label}</span>
      <span className="shrink-0 font-medium">{value}</span>
    </div>
  );
}

/** Returns `value`, updated at most once every `ms` (and always with the latest value). */
// Shown over the 3D view while the shirt and design load
function PreviewCover({ dark, hidden }: { dark: boolean; hidden: boolean }) {
  return (
    <div
      aria-hidden={hidden}
      className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 transition-opacity duration-500 ${
        dark ? "bg-ink text-paper" : "bg-white text-ink"
      } ${hidden ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      <svg viewBox="0 0 200 200" className="w-24 h-24 animate-pulse" aria-hidden>
        <path
          d="M72 22 L40 32 L8 62 L30 90 L50 76 L50 180 L150 180 L150 76 L170 90 L192 62 L160 32 L128 22 Q118 42 100 42 Q82 42 72 22 Z"
          className={dark ? "fill-paper/10 stroke-paper/60" : "fill-ink/5 stroke-ink/40"}
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </svg>
      <p className="text-sm font-medium opacity-70" role="status">
        Preparing your 3D preview…
      </p>
    </div>
  );
}

function useThrottled<T>(value: T, ms: number) {
  const [out, setOut] = useState(value);
  const last = useRef(0);
  useEffect(() => {
    const wait = Math.max(0, last.current + ms - Date.now());
    const t = setTimeout(() => {
      last.current = Date.now();
      setOut(value);
    }, wait);
    return () => clearTimeout(t);
  }, [value, ms]);
  return out;
}
