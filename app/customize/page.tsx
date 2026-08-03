"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Upload,
  RotateCw,
  Move,
  Trash2,
  ShoppingBag,
  Check,
  RotateCcw,
} from "lucide-react";
import { CATEGORIES, getProductById } from "@/lib/products";
import {
  DESIGN_CATEGORIES,
  DESIGNS,
  Design,
  getDesignsByCategory,
  fetchSupabaseDesigns,
} from "@/lib/designs";
import {
  COLORS,
  SIZES,
  BASE_PRICE_BY_CATEGORY,
  CUSTOM_PRINT_FEE,
} from "@/lib/constants";
import { useCart } from "@/lib/cart-context";
import DesignPlacementEditor from "@/components/DesignPlacementEditor";

// The 3D canvas touches window/document — load it only on the client.
const TShirtViewer = dynamic(() => import("@/components/TShirtViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-sm text-neutral-400">
      Loading 3D preview…
    </div>
  ),
});

function CustomizeContent() {
  const searchParams = useSearchParams();
  const { addItem } = useCart();

  const initialProduct = getProductById(searchParams?.get("product") || "");
  const [category, setCategory] = useState(
    initialProduct?.category || "oversized-tees"
  );
  const [color, setColor] = useState(
    searchParams?.get("color") || initialProduct?.colors[0] || "#ffffff"
  );
  const [size, setSize] = useState(searchParams?.get("size") || "M");

  const [designSource, setDesignSource] = useState<"gallery" | "upload">(
    "gallery"
  );
  const [designCategory, setDesignCategory] = useState<string>("Typography");
  const [supabaseDesigns, setSupabaseDesigns] = useState<Design[]>([]);
  const [loadingSupabaseDesigns, setLoadingSupabaseDesigns] = useState(true);
  const [decalSrc, setDecalSrc] = useState<string | null>(() => {
    const fromQuery = searchParams?.get("designSrc");
    return fromQuery ? decodeURIComponent(fromQuery) : null;
  });
  const [decalName, setDecalName] = useState<string>(() => {
    const fromQuery = searchParams?.get("designName");
    return fromQuery ? decodeURIComponent(fromQuery) : "";
  });
  const [side, setSide] = useState<"front" | "back">("front");
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [addedFlash, setAddedFlash] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const decal = useMemo(
    () =>
      decalSrc
        ? { src: decalSrc, scale, rotation, offsetX, offsetY, side }
        : null,
    [decalSrc, scale, rotation, offsetX, offsetY, side]
  );

  const basePrice = initialProduct?.price ?? BASE_PRICE_BY_CATEGORY[category] ?? 799;
  const finalPrice = basePrice + (decal ? CUSTOM_PRINT_FEE : 0);

  const resetTransforms = () => {
    setScale(1);
    setRotation(0);
    setOffsetX(0);
    setOffsetY(0);
  };

  // Used by the drag-to-move / drag-to-resize position guide below.
  const applyPlacement = (patch: Partial<{ offsetX: number; offsetY: number; scale: number }>) => {
    if (patch.offsetX !== undefined) setOffsetX(patch.offsetX);
    if (patch.offsetY !== undefined) setOffsetY(patch.offsetY);
    if (patch.scale !== undefined) setScale(patch.scale);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setDecalSrc(reader.result as string);
      setDecalName(file.name);
      setDesignSource("upload");
      resetTransforms();
    };
    reader.readAsDataURL(file);
  };

  const selectGalleryDesign = (src: string, name: string) => {
    setDecalSrc(src);
    setDecalName(name);
    resetTransforms();
  };

  const removeDesign = () => {
    setDecalSrc(null);
    setDecalName("");
    resetTransforms();
  };

  const handleAddToCart = () => {
    const categoryLabel =
      CATEGORIES.find((c) => c.slug === category)?.label || "Custom Product";
    const colorLabel = COLORS.find((c) => c.hex === color)?.label || "Custom";

    addItem({
      productId: initialProduct?.id || `custom-${category}`,
      name: initialProduct?.name || `Custom ${categoryLabel}`,
      price: finalPrice,
      size,
      color,
      colorLabel,
      qty: 1,
      image: initialProduct?.image || "/tshirt-thumb.png",
      custom: true,
      designName: decalName || undefined,
      designSrc: decalSrc || undefined,
      designSide: decal ? side : undefined,
      designOffsetX: decal ? offsetX : undefined,
      designOffsetY: decal ? offsetY : undefined,
      designRotation: decal ? rotation : undefined,
    });
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 1800);
  };

  useEffect(() => {
    if (initialProduct?.colors?.[0]) setColor(initialProduct.colors[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pull in any designs uploaded via Supabase and merge them with the
  // built-in gallery. If Supabase isn't configured (or the request fails),
  // fetchSupabaseDesigns() resolves to [] and the built-in gallery is all
  // that shows — the page never breaks because of this.
  useEffect(() => {
    let cancelled = false;
    fetchSupabaseDesigns()
      .then((rows) => {
        if (!cancelled) setSupabaseDesigns(rows);
      })
      .finally(() => {
        if (!cancelled) setLoadingSupabaseDesigns(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const allDesigns = useMemo(
    () => [...supabaseDesigns, ...DESIGNS],
    [supabaseDesigns]
  );
  const allDesignCategories = useMemo(() => {
    const extra = Array.from(new Set(supabaseDesigns.map((d) => d.category))).filter(
      (c) => !(DESIGN_CATEGORIES as readonly string[]).includes(c)
    );
    return [...extra, ...DESIGN_CATEGORIES];
  }, [supabaseDesigns]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-poppins">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-wider text-neutral-500">
          Customize
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold text-neutral-900 mt-1">
          {initialProduct ? initialProduct.name : "Design Your Own"}
        </h1>
        <p className="text-neutral-500 mt-2 max-w-2xl">
          Pick a garment, choose a color, then upload your own artwork or pick a
          print from our gallery. Drag to rotate the 3D preview.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 items-start">
        {/* ── 3D Viewer + Position Guide ── */}
        <div className="sticky top-6 space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-neutral-200 bg-gradient-to-b from-neutral-50 to-neutral-100 h-[420px] sm:h-[480px]">
            <Suspense fallback={null}>
              <TShirtViewer color={color} decal={decal} />
            </Suspense>
            <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm text-[11px] font-medium text-neutral-600 px-3 py-1.5 rounded-full shadow-sm">
              Drag to rotate · Scroll to zoom
            </div>
            {decal && (
              <button
                onClick={() => setSide(side === "front" ? "back" : "front")}
                className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-xs font-semibold text-neutral-800 px-3 py-1.5 rounded-full shadow-sm hover:bg-white transition-colors"
              >
                Viewing: {side === "front" ? "Front" : "Back"} (tap to flip)
              </button>
            )}
          </div>

          {/* Position guide — always shows where the design will sit on
              front vs. back. Only uploaded (custom) designs can be dragged
              to reposition — gallery prints come pre-sized and centered. */}
          <div>
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-2">
              Position Guide
              {decalSrc && designSource === "upload" && " · drag to place"}
            </p>
            <div className="grid grid-cols-2 gap-4">
              {(["front", "back"] as const).map((s) => (
                <div
                  key={s}
                  className={`relative rounded-2xl border-2 bg-neutral-50 p-2 transition-colors ${
                    side === s ? "border-neutral-900" : "border-neutral-200"
                  }`}
                >
                  <DesignPlacementEditor
                    color={color}
                    category={category}
                    side={s}
                    decalSrc={decalSrc}
                    active={side === s}
                    interactive={side === s && !!decalSrc && designSource === "upload"}
                    placement={{ offsetX, offsetY, scale, rotation }}
                    onPlacementChange={applyPlacement}
                    onSelectSide={() => setSide(s)}
                  />
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-wide text-neutral-500 bg-white/80 px-2 py-0.5 rounded-full pointer-events-none">
                    {s} {side === s && decalSrc && "· \u2713"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Controls ── */}
        <div className="space-y-8">
          {/* Garment category */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">
              1. Garment
            </h3>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => setCategory(c.slug)}
                  className={`px-3.5 py-2 rounded-full text-xs font-medium transition-colors ${
                    category === c.slug
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">
              2. Color
            </h3>
            <div className="flex flex-wrap gap-3">
              {COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setColor(c.hex)}
                  title={c.label}
                  className="flex flex-col items-center gap-1"
                >
                  <span
                    className="w-9 h-9 rounded-full block transition-transform"
                    style={{
                      backgroundColor: c.hex,
                      border:
                        color === c.hex
                          ? "2px solid #111"
                          : c.hex === "#ffffff"
                            ? "1px solid #ddd"
                            : "2px solid transparent",
                      transform: color === c.hex ? "scale(1.1)" : "scale(1)",
                    }}
                  />
                  <span className="text-[10px] text-neutral-500">
                    {c.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">
              3. Size
            </h3>
            <div className="flex gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`w-11 h-11 rounded-lg text-sm font-semibold transition-colors ${
                    size === s
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Design source */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">
              4. Your Design
            </h3>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setDesignSource("gallery")}
                className={`flex-1 py-2.5 rounded-full text-xs font-semibold transition-colors ${
                  designSource === "gallery"
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                Choose a Print
              </button>
              <button
                onClick={() => {
                  setDesignSource("upload");
                  fileInputRef.current?.click();
                }}
                className={`flex-1 py-2.5 rounded-full text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                  designSource === "upload"
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                <Upload className="w-3.5 h-3.5" /> Upload Your Own
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
              />
            </div>

            {designSource === "gallery" && (
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {allDesignCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setDesignCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
                        designCategory === cat
                          ? "bg-neutral-800 text-white"
                          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                {loadingSupabaseDesigns && (
                  <p className="text-[11px] text-neutral-400 mb-2">
                    Checking for more designs…
                  </p>
                )}
                <div className="grid grid-cols-4 gap-2">
                  {getDesignsByCategory(designCategory, allDesigns).map((d) => (
                    <button
                      key={d.id}
                      onClick={() => selectGalleryDesign(d.src, d.name)}
                      title={d.name}
                      className={`aspect-square rounded-lg border-2 bg-white p-2 flex items-center justify-center transition-colors ${
                        decalSrc === d.src
                          ? "border-neutral-900"
                          : "border-neutral-200 hover:border-neutral-400"
                      }`}
                    >
                      <img
                        src={d.src}
                        alt={d.name}
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {designSource === "upload" && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-300 rounded-xl p-6 text-center cursor-pointer hover:border-neutral-500 transition-colors bg-white"
              >
                {decalSrc && designSource === "upload" ? (
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={decalSrc}
                      alt="Uploaded design"
                      className="w-20 h-20 object-contain"
                    />
                    <p className="text-xs text-neutral-500 truncate max-w-full font-medium">
                      {decalName}
                    </p>
                    <span className="text-xs font-semibold underline text-neutral-800">
                      Replace file
                    </span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 mx-auto text-neutral-400 mb-2" />
                    <p className="text-sm font-medium text-neutral-700">
                      Click to upload PNG, JPG or SVG
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      Transparent PNG works best
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Placement controls — only for uploaded (custom) designs.
              Gallery prints come pre-sized/centered and aren't adjustable. */}
          {decal && designSource === "upload" && (
            <div className="space-y-4 border border-neutral-200 rounded-xl p-4 bg-neutral-50/50">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-1.5">
                  <Move className="w-4 h-4" /> Placement
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={resetTransforms}
                    className="text-xs text-neutral-500 hover:text-neutral-900 font-medium flex items-center gap-1 transition-colors"
                    title="Reset position"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                  <button
                    onClick={removeDesign}
                    className="text-xs text-red-600 font-medium flex items-center gap-1 hover:underline"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-neutral-400 -mt-2">
                Tip: you can also drag the design directly in the Position
                Guide above to move it.
              </p>

              <div className="flex gap-2">
                {(["front", "back"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSide(s)}
                    className={`flex-1 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                      side === s
                        ? "bg-neutral-900 text-white"
                        : "bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <label className="block text-xs text-neutral-600 space-y-1">
                <span className="font-medium">Move Left / Right</span>
                <input
                  type="range"
                  min={-0.8}
                  max={0.8}
                  step={0.05}
                  value={offsetX}
                  onChange={(e) => setOffsetX(parseFloat(e.target.value))}
                  className="w-full accent-neutral-900"
                />
              </label>

              <label className="block text-xs text-neutral-600 space-y-1">
                <span className="font-medium">Move Up / Down</span>
                <input
                  type="range"
                  min={-0.8}
                  max={0.8}
                  step={0.05}
                  value={offsetY}
                  onChange={(e) => setOffsetY(parseFloat(e.target.value))}
                  className="w-full accent-neutral-900"
                />
              </label>

              <label className="block text-xs text-neutral-600 space-y-1">
                <span className="font-medium flex items-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5" /> Rotation
                </span>
                <input
                  type="range"
                  min={-Math.PI}
                  max={Math.PI}
                  step={0.05}
                  value={rotation}
                  onChange={(e) => setRotation(parseFloat(e.target.value))}
                  className="w-full accent-neutral-900"
                />
              </label>
            </div>
          )}

          {/* Gallery prints: fixed placement, only side + remove are adjustable */}
          {decal && designSource === "gallery" && (
            <div className="space-y-3 border border-neutral-200 rounded-xl p-4 bg-neutral-50/50">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-1.5">
                  <Move className="w-4 h-4" /> Placement
                </h3>
                <button
                  onClick={removeDesign}
                  className="text-xs text-red-600 font-medium flex items-center gap-1 hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
              <p className="text-[11px] text-neutral-400">
                Gallery prints are centered at a fixed size. Upload your own
                artwork if you'd like to reposition it.
              </p>
              <div className="flex gap-2">
                {(["front", "back"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSide(s)}
                    className={`flex-1 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                      side === s
                        ? "bg-neutral-900 text-white"
                        : "bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price + Add to cart */}
          <div className="border-t border-neutral-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-neutral-500">Total price</p>
                <p className="text-2xl font-semibold text-neutral-900">
                  ₹{finalPrice}
                </p>
                {decal && (
                  <p className="text-xs text-neutral-400">
                    Includes ₹{CUSTOM_PRINT_FEE} custom print fee
                  </p>
                )}
              </div>
              <div className="text-xs text-neutral-500 text-right">
                Size {size} · Qty 1
              </div>
            </div>
            <button
              onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-2 bg-neutral-900 text-white text-sm font-semibold py-3.5 rounded-full hover:bg-neutral-800 transition-colors"
            >
              {addedFlash ? (
                <>
                  <Check className="w-4 h-4" /> Added to Cart
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" /> Add to Cart
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomizePage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-neutral-500">Loading editor…</div>}>
      <CustomizeContent />
    </Suspense>
  );
}
