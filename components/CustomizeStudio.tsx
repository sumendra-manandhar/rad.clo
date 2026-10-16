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
  Layers as LayersIcon,
  Shirt,
  ChevronDown,
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
  PRINT_LOCATIONS,
  areaSize,
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

const PRINT_AREA_NUMBER = (l: PrintLocation) => PRINT_LOCATIONS.indexOf(l) + 1;

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
  // Editor side panel: add artwork, manage what's on the shirt, or pick the shirt itself.
  const [panel, setPanel] = useState<"add" | "designs" | "shirt">(initialDesign && !mode ? "designs" : "add");
  // Print area new designs go to (null = the main area of the side being viewed).
  const [addTo, setAddTo] = useState<string | null>(null);
  const [newText, setNewText] = useState("YOUR TEXT");
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

  /** Adds a design to the chosen print area (by default the main area of the side being viewed). */
  const addTarget = locations.find((l) => l.id === (addTo ?? AREA_FOR_VIEW[view.name])) ?? locations[0];
  const addLayer = (art: Art, aspect = 1) => {
    const loc = addTarget;
    if (loc.view !== view.name) focus(loc.view);
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
    if (l) setPanel("designs");
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
        <aside className="order-3 lg:order-1 bg-paper text-ink flex flex-col lg:min-h-0">
          {/* Three clear steps */}
          <nav className="shrink-0 grid grid-cols-3 gap-1 p-2 border-b border-line bg-white" aria-label="Editor panels">
            {(
              [
                ["add", "Add design", Plus, "Art or text"],
                ["designs", "My designs", LayersIcon, layers.length ? `${layers.length} on shirt` : "None yet"],
                ["shirt", "Shirt & size", Shirt, `${size} · ${colorLabel(color)}`],
              ] as const
            ).map(([id, label, Icon, sub]) => (
              <button
                key={id}
                onClick={() => setPanel(id)}
                aria-current={panel === id}
                className={`relative flex flex-col items-center gap-0.5 rounded-xl px-1 py-2.5 transition-colors ${
                  panel === id ? "bg-ink text-paper" : "hover:bg-paper text-ink"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs font-semibold">{label}</span>
                <span className={`text-[10px] truncate max-w-full ${panel === id ? "text-paper/60" : "text-muted"}`}>{sub}</span>
                {id === "designs" && layers.length > 0 && (
                  <span className="absolute top-1.5 right-2 min-w-4 h-4 px-1 rounded-full bg-lime text-ink text-[10px] font-black flex items-center justify-center">
                    {layers.length}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="flex-1 lg:min-h-0 lg:overflow-y-auto p-5 space-y-5">
            {panel === "add" && (
              <>
                {/* Where to print first, then what */}
                <label className="flex items-center justify-between gap-3 rounded-2xl bg-white border border-line px-4 py-3">
                  <span className="text-xs">
                    <span className="block font-bold uppercase tracking-widest text-muted">Print on</span>
                    <span className="block text-muted mt-0.5">{areaSize(addTarget)} max</span>
                  </span>
                  <span className="relative">
                    <select
                      value={addTarget.id}
                      onChange={(e) => {
                        setAddTo(e.target.value);
                        const l = getLocation(e.target.value);
                        if (l && l.view !== view.name) focus(l.view);
                      }}
                      className="appearance-none rounded-full bg-ink text-paper text-sm font-semibold pl-4 pr-9 py-2 cursor-pointer"
                    >
                      {locations.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-paper" />
                  </span>
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ["store", "Our designs", Images],
                      ["upload", "Upload", Upload],
                      ["text", "Text", Type],
                    ] as const
                  ).map(([m, label, Icon]) => (
                    <button
                      key={m}
                      onClick={() => setTab(m)}
                      className={`flex flex-col items-center gap-1.5 rounded-2xl border py-3 text-xs font-semibold transition-colors ${
                        tab === m ? "border-ink bg-white ring-1 ring-ink" : "border-line bg-white/60 hover:border-ink/40"
                      }`}
                    >
                      <Icon className="w-5 h-5" /> {label}
                    </button>
                  ))}
                </div>

                {tab === "store" && (
                  <div className="space-y-2.5">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        value={storeQuery}
                        onChange={(e) => setStoreQuery(e.target.value)}
                        placeholder="Search designs"
                        className="w-full rounded-full border border-line bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-ink"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {[{ slug: "all", name: "All" }, ...categories.filter((c) => designs.some((d) => d.category === c.slug))].map((c) => (
                        <button
                          key={c.slug}
                          onClick={() => setStoreCat(c.slug)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                            storeCat === c.slug ? "bg-ink text-paper" : "bg-white border border-line"
                          }`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                    {storeList.length ? (
                      <div className="grid grid-cols-3 gap-1.5">
                        {storeList.map((d) => (
                          <button
                            key={d.id}
                            onClick={() => addLayer({ type: "gallery", designId: d.id })}
                            title={`Add ${d.name} to the ${addTarget.label.toLowerCase()}`}
                            className="group relative aspect-square rounded-xl border border-line bg-white p-1.5 hover:border-ink"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={d.image} alt={d.name} className="w-full h-full object-contain" loading="lazy" />
                            <span className="absolute inset-0 rounded-xl bg-ink/60 text-paper text-[11px] font-semibold flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Plus className="w-3.5 h-3.5" /> Add
                            </span>
                            {d.price > 0 && (
                              <span className="absolute bottom-1 right-1 text-[9px] font-semibold bg-ink text-paper rounded-full px-1.5 py-px">
                                +{formatPrice(d.price)}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted text-center py-6">No designs match.</p>
                    )}
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
                      className="w-full border-2 border-dashed border-line rounded-2xl px-5 py-8 text-center hover:border-ink bg-white"
                    >
                      <Upload className="w-6 h-6 mx-auto text-muted mb-2" />
                      <p className="text-sm font-semibold">Drop your artwork or tap to upload</p>
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
                  </div>
                )}

                {tab === "text" && (
                  <div className="space-y-2.5">
                    <textarea
                      value={newText}
                      onChange={(e) => setNewText(e.target.value.slice(0, 80))}
                      rows={2}
                      placeholder="Type your text"
                      className="w-full rounded-xl border border-line bg-white px-3 py-2 font-semibold focus:outline-none focus:border-ink resize-none"
                    />
                    <button
                      onClick={() => newText.trim() && addText(newText)}
                      disabled={!newText.trim()}
                      className="w-full flex items-center justify-center gap-1.5 bg-ink text-paper text-sm font-semibold py-2.5 rounded-full hover:bg-flame disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" /> Add text
                    </button>
                    <p className="text-[11px] text-muted">Change the font and colour after adding, in My designs.</p>
                  </div>
                )}
              </>
            )}

            {panel === "designs" &&
              (layers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-line bg-white py-12 px-6 text-center">
                  <LayersIcon className="w-6 h-6 mx-auto text-muted" />
                  <p className="font-semibold mt-3">Nothing on your shirt yet</p>
                  <p className="text-xs text-muted mt-1">Add one of our designs, your own artwork or text.</p>
                  <button
                    onClick={() => setPanel("add")}
                    className="mt-5 inline-flex items-center gap-1.5 bg-ink text-paper text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-flame"
                  >
                    <Plus className="w-4 h-4" /> Add a design
                  </button>
                </div>
              ) : (
                <>
                  <ul className="space-y-2">
                    {placed.map(({ layer, loc }) => {
                      const on = selected === layer.id;
                      return (
                        <li key={layer.id} className={`rounded-2xl border bg-white ${on ? "border-ink ring-1 ring-ink" : "border-line"}`}>
                          <div className="flex items-center gap-3 p-2 pr-2.5">
                            <button onClick={() => selectLayer(layer.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={srcOf(layer)} alt="" className="w-12 h-12 rounded-xl object-contain bg-paper p-1 shrink-0" />
                              <span className="min-w-0">
                                <span className="block text-sm font-semibold truncate">{nameOf(layer)}</span>
                                <span
                                  className={`inline-block mt-1 text-[11px] font-semibold rounded-full px-2 py-0.5 ${
                                    loc ? "bg-paper text-ink" : "bg-red-50 text-red-600"
                                  }`}
                                >
                                  {loc ? `${loc.label} · ${areaSize(loc)}` : "Area not offered — move it"}
                                </span>
                              </span>
                            </button>
                            <button onClick={() => removeLayer(layer.id)} className="p-2 rounded-full text-muted hover:text-red-600 hover:bg-red-50" aria-label="Remove design">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {on && layer.type === "text" && (
                            <div className="border-t border-line p-3 space-y-2.5">
                              <textarea
                                value={layer.text}
                                onChange={(e) => updateLayer(layer.id, { text: e.target.value.slice(0, 80) })}
                                rows={2}
                                className="w-full rounded-xl border border-line bg-white px-3 py-2 font-semibold focus:outline-none focus:border-ink resize-none"
                              />
                              <div className="flex gap-1 flex-wrap">
                                {TEXT_FONTS.map((f) => (
                                  <button
                                    key={f.id}
                                    onClick={() => updateLayer(layer.id, { fontId: f.id })}
                                    className={`px-3 py-1.5 rounded-full text-sm border ${
                                      layer.fontId === f.id ? "bg-ink text-paper border-ink" : "bg-white border-line"
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
                                    onClick={() => updateLayer(layer.id, { color: c })}
                                    aria-label={`Text colour ${c}`}
                                    className={`w-7 h-7 rounded-full border border-black/15 ${layer.color === c ? "ring-2 ring-ink ring-offset-2" : ""}`}
                                    style={{ backgroundColor: c }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <p className="text-[11px] text-muted text-center">
                    Tap a design to select it, then move, resize or change its print area on the position guide.
                  </p>
                  <button
                    onClick={() => setPanel("add")}
                    className="w-full flex items-center justify-center gap-1.5 border border-dashed border-ink/30 text-sm font-semibold py-3 rounded-2xl hover:border-ink"
                  >
                    <Plus className="w-4 h-4" /> Add another design
                  </button>
                </>
              ))}

            {panel === "shirt" && options}
          </div>

          {/* What you're buying, always visible */}
          <details className="group shrink-0 border-t border-line bg-white">
            <summary className="flex items-center gap-3 px-5 py-3.5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <span className="w-8 h-8 rounded-full border border-black/15 shrink-0" style={{ backgroundColor: color }} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold truncate">
                  {g.label} · {colorLabel(color)} · {size}
                  {qty > 1 && ` × ${qty}`}
                </span>
                <span className="block text-xs text-muted truncate">
                  {areasUsed.length ? `${printed.length} design${printed.length === 1 ? "" : "s"} · ${areasUsed.map((l) => l.label).join(", ")}` : "No prints yet"}
                </span>
              </span>
              <span className="text-right shrink-0">
                <span className="block font-display font-bold">{formatPrice(unitPrice * qty)}</span>
                <span className="text-[11px] text-muted inline-flex items-center gap-0.5">
                  Details <ChevronDown className="w-3 h-3 transition-transform group-open:rotate-180" />
                </span>
              </span>
            </summary>
            <div className="px-5 pb-4 text-muted">{priceLines}</div>
          </details>
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
            {sel ? "Drag to move · drag a corner to resize" : "Tap a design on the shirt to adjust it"}
          </p>

          {sel ? (
            <SelectedDesign
              key={sel.id}
              name={nameOf(sel)}
              src={srcOf(sel)}
              layer={sel}
              area={selPiece}
              locations={locations}
              areaPrices={pricing.location}
              designPrice={selDesignPrice}
              onArea={(l) => moveToArea(sel, l)}
              onBox={(box) => updateLayer(sel.id, { box })}
              onDuplicate={() => duplicateLayer(sel)}
              onRemove={() => removeLayer(sel.id)}
            />
          ) : (
            <div className="mt-5 pt-5 border-t border-line">
              <p className="text-xs font-bold uppercase tracking-widest text-muted mb-2.5">Print areas & sizes</p>
              <PrintAreasLegend locations={locations} prices={pricing.location} used={areasUsed.map((l) => l.id)} />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

/** Controls for the design selected on the position guide. */
function SelectedDesign({
  name,
  src,
  layer,
  area,
  locations,
  areaPrices,
  designPrice,
  onArea,
  onBox,
  onDuplicate,
  onRemove,
}: {
  name: string;
  src: string;
  layer: Layer;
  area?: PrintLocation;
  locations: PrintLocation[];
  areaPrices: Record<string, number>;
  designPrice: number;
  onArea: (l: PrintLocation) => void;
  onBox: (b: GuideBox) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const b = layer.box;
  const maxW = area ? fitInside({ ...b, w: Infinity }, layer.aspect, area.rect).w : b.w;
  const minW = area ? Math.min(maxW, area.rect.w / 6) : b.w;
  const perInch = area ? area.rect.w / area.inches.w : 1;
  const wIn = b.w / perInch;
  const hIn = wIn / (layer.aspect || 1);
  const offIn = area ? (b.cx - (area.rect.x + area.rect.w / 2)) / perInch : 0;
  const where = Math.abs(offIn) < 0.15 ? "centred" : `${Math.abs(offIn).toFixed(1)}″ ${offIn > 0 ? "right" : "left"} of centre`;
  const deg = Math.round((b.rotation * 180) / Math.PI);
  const rotate = (d: number) => {
    const r = b.rotation + (d * Math.PI) / 180;
    onBox({ ...b, rotation: Math.abs(r) < 1e-6 ? 0 : Math.atan2(Math.sin(r), Math.cos(r)) });
  };
  const sizes: [string, number][] = [
    ["Small", 0.5],
    ["Medium", 0.75],
    ["Fill", 1],
  ];

  return (
    <div className="mt-5 pt-5 border-t border-line space-y-5">
      {/* What's selected, in one line */}
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="w-12 h-12 rounded-xl object-contain bg-paper p-1 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate">{name}</p>
          <p className="text-xs text-muted">
            {area ? `${area.label} · ${wIn.toFixed(1)}″ × ${hIn.toFixed(1)}″ · ${where}` : "Pick a print area below"}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {(
          [
            ["Centre", Crosshair, () => area && onBox({ ...b, cx: area.rect.x + area.rect.w / 2 }), false],
            ["Duplicate", Copy, onDuplicate, false],
            ["Remove", Trash2, onRemove, true],
          ] as const
        ).map(([label, Icon, run, danger]) => (
          <button
            key={label}
            onClick={run}
            className={`flex items-center justify-center gap-1.5 rounded-xl border border-line py-2 text-xs font-semibold transition-colors ${
              danger ? "text-red-600 hover:bg-red-50 hover:border-red-200" : "hover:border-ink"
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Print area — numbers match the badges on the guide */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted mb-2">Print area</p>
        <div className="grid grid-cols-2 gap-1.5">
          {locations.map((l) => {
            const on = layer.area === l.id;
            return (
              <button
                key={l.id}
                onClick={() => onArea(l)}
                aria-pressed={on}
                className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-colors ${
                  on ? "bg-ink text-paper border-ink" : "border-line hover:border-ink/40"
                }`}
              >
                <span
                  className={`w-5 h-5 shrink-0 rounded-full text-[11px] font-black flex items-center justify-center ${
                    on ? "bg-lime text-ink" : "bg-[#c99700] text-white"
                  }`}
                >
                  {PRINT_AREA_NUMBER(l)}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold truncate">{l.label}</span>
                  <span className={`block text-[11px] ${on ? "text-paper/60" : "text-muted"}`}>
                    {areaSize(l)} · +{formatPrice(areaPrices[l.id] ?? 0)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {area && (
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted">Size</p>
            <p className="text-xs text-muted">
              {wIn.toFixed(1)}″ wide · max {(maxW / perInch).toFixed(1)}″
            </p>
          </div>
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {sizes.map(([label, f]) => {
              const on = Math.abs(b.w - maxW * f) < 1;
              return (
                <button
                  key={label}
                  onClick={() => onBox({ ...b, w: Math.max(minW, maxW * f) })}
                  className={`rounded-xl border py-2 text-xs font-semibold transition-colors ${
                    on ? "bg-ink text-paper border-ink" : "border-line hover:border-ink/40"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <input
            type="range"
            min={minW}
            max={maxW}
            step={0.5}
            value={Math.min(b.w, maxW)}
            onChange={(e) => onBox({ ...b, w: parseFloat(e.target.value) })}
            aria-label="Design width"
            className="w-full accent-ink"
          />
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-widest text-muted">Rotate</p>
        <div className="flex items-center gap-1.5">
          <button onClick={() => rotate(-15)} aria-label="Rotate left 15°" className="w-9 h-9 rounded-xl border border-line hover:border-ink flex items-center justify-center">
            <RotateCw className="w-4 h-4 -scale-x-100" />
          </button>
          <button
            onClick={() => rotate(-deg)}
            className={`min-w-14 h-9 px-2 rounded-xl border text-xs font-semibold ${deg ? "border-line hover:border-ink" : "border-transparent text-muted"}`}
            title="Reset rotation"
          >
            {deg}°
          </button>
          <button onClick={() => rotate(15)} aria-label="Rotate right 15°" className="w-9 h-9 rounded-xl border border-line hover:border-ink flex items-center justify-center">
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {(designPrice > 0 || area) && (
        <p className="text-xs text-muted rounded-xl bg-paper px-3 py-2.5">
          {area && <>{area.label} print +{formatPrice(areaPrices[area.id] ?? 0)} (once per shirt)</>}
          {designPrice > 0 && <> · design +{formatPrice(designPrice)}</>}
        </p>
      )}
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
