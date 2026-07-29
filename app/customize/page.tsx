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
} from "lucide-react";
import { CATEGORIES, getProductById } from "@/lib/products";
import { DESIGN_CATEGORIES, getDesignsByCategory } from "@/lib/designs";
import {
  COLORS,
  SIZES,
  BASE_PRICE_BY_CATEGORY,
  CUSTOM_PRINT_FEE,
} from "@/lib/constants";
import { useCart } from "@/lib/cart-context";

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
  const [decalSrc, setDecalSrc] = useState<string | null>(null);
  const [decalName, setDecalName] = useState<string>("");
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

  const basePrice = initialProduct?.price ?? BASE_PRICE_BY_CATEGORY[category];
  const finalPrice = basePrice + (decal ? CUSTOM_PRINT_FEE : 0);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setDecalSrc(reader.result as string);
      setDecalName(file.name);
      setDesignSource("upload");
    };
    reader.readAsDataURL(file);
  };

  const selectGalleryDesign = (src: string, name: string) => {
    setDecalSrc(src);
    setDecalName(name);
  };

  const removeDesign = () => {
    setDecalSrc(null);
    setDecalName("");
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
    });
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 1800);
  };

  useEffect(() => {
    if (initialProduct) setColor(initialProduct.colors[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          Pick a garment, choose a color, then upload your own artwork or pick
          a print from our gallery. Drag to rotate the 3D preview.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8">
        {/* ── 3D Viewer ── */}
        <div className="relative rounded-2xl overflow-hidden border border-neutral-200 bg-gradient-to-b from-neutral-50 to-neutral-100 h-[420px] sm:h-[520px] lg:h-auto lg:min-h-[640px]">
          <Suspense fallback={null}>
            <TShirtViewer color={color} decal={decal} />
          </Suspense>
          <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm text-[11px] font-medium text-neutral-600 px-3 py-1.5 rounded-full">
            Drag to rotate · Scroll to zoom
          </div>
          {decal && (
            <button
              onClick={() => setSide(side === "front" ? "back" : "front")}
              className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-xs font-semibold text-neutral-800 px-3 py-1.5 rounded-full shadow-sm hover:bg-white"
            >
              Viewing: {side === "front" ? "Front" : "Back"} (tap to flip)
            </button>
          )}
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
                  {DESIGN_CATEGORIES.map((cat) => (
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
                <div className="grid grid-cols-4 gap-2">
                  {getDesignsByCategory(designCategory).map((d) => (
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
                      <img src={d.src} alt={d.name} className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {designSource === "upload" && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-300 rounded-xl p-6 text-center cursor-pointer hover:border-neutral-500 transition-colors"
              >
                {decalSrc && designSource === "upload" ? (
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={decalSrc}
                      alt="Uploaded design"
                      className="w-20 h-20 object-contain"
                    />
                    <p className="text-xs text-neutral-500 truncate max-w-full">
                      {decalName}
                    </p>
                    <span className="text-xs font-semibold underline">
                      Replace file
                    </span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 mx-auto text-neutral-400 mb-2" />
                    <p className="text-sm text-neutral-600">
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

          {/* Placement controls */}
          {decal && (
            <div className="space-y-4 border border-neutral-200 rounded-xl p-4 bg-neutral-50">
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

              <div className="flex gap-2">
                {(["front", "back"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSide(s)}
                    className={`flex-1 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                      side === s
                        ? "bg-neutral-900 text-white"
                        : "bg-white border border-neutral-300 text-neutral-700"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <label className="block text-xs text-neutral-500">
                Size
                <input
                  type="range"
                  min={0.4}
                  max={2}
                  step={0.05}
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full accent-neutral-900"
                />
              </label>
              <label className="block text-xs text-neutral-500">
                Move Left / Right
                <input
                  type="range"
                  min={-1}
                  max={1}
                  step={0.05}
                  value={offsetX}
                  onChange={(e) => setOffsetX(parseFloat(e.target.value))}
                  className="w-full accent-neutral-900"
                />
              </label>
              <label className="block text-xs text-neutral-500">
                Move Up / Down
                <input
                  type="range"
                  min={-1}
                  max={1}
                  step={0.05}
                  value={offsetY}
                  onChange={(e) => setOffsetY(parseFloat(e.target.value))}
                  className="w-full accent-neutral-900"
                />
              </label>
              <label className="block text-xs text-neutral-500 flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5" /> Rotation
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
              className="w-full flex items-center justify-center gap-2 bg-neutral-900 text-white text-sm font-semibold py-3.5 rounded-full hover:bg-neutral-700 transition-colors"
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
    <Suspense fallback={<div className="py-20 text-center">Loading…</div>}>
      <CustomizeContent />
    </Suspense>
  );
}
