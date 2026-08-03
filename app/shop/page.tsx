"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CATEGORIES, getProductsByCategory } from "@/lib/products";
import {
  DESIGN_CATEGORIES,
  DESIGNS,
  Design,
  getDesignsByCategory,
  fetchSupabaseDesigns,
} from "@/lib/designs";
import { useCart } from "@/lib/cart-context";
import { Palette, Shirt } from "lucide-react";

type ViewMode = "products" | "designs";

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeCategory = searchParams?.get("category") || "all";
  const view: ViewMode = searchParams?.get("view") === "designs" ? "designs" : "products";
  const { addItem } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);

  const products = useMemo(
    () => getProductsByCategory(activeCategory),
    [activeCategory]
  );

  const setCategory = (slug: string) => {
    const base = view === "designs" ? "/shop?view=designs" : "/shop";
    const sep = view === "designs" ? "&" : "?";
    router.push(slug === "all" ? base : `${base}${sep}category=${slug}`);
  };

  const setView = (v: ViewMode) => {
    router.push(v === "designs" ? "/shop?view=designs" : "/shop");
  };

  const quickAdd = (p: (typeof products)[number]) => {
    addItem({
      productId: p.id,
      name: p.name,
      price: p.price,
      size: "M",
      color: p.colors[0],
      colorLabel: "Default",
      qty: 1,
      image: p.image,
    });
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  // ── Designs gallery ──────────────────────────────────────────────────────
  const [supabaseDesigns, setSupabaseDesigns] = useState<Design[]>([]);
  const [loadingDesigns, setLoadingDesigns] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchSupabaseDesigns()
      .then((rows) => {
        if (!cancelled) setSupabaseDesigns(rows);
      })
      .finally(() => {
        if (!cancelled) setLoadingDesigns(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const allDesigns = useMemo(() => [...supabaseDesigns, ...DESIGNS], [supabaseDesigns]);
  const allDesignCategories = useMemo(() => {
    const extra = Array.from(new Set(supabaseDesigns.map((d) => d.category))).filter(
      (c) => !(DESIGN_CATEGORIES as readonly string[]).includes(c)
    );
    return [...extra, ...DESIGN_CATEGORIES];
  }, [supabaseDesigns]);

  const designCategory = view === "designs" ? activeCategory : "all";
  const filteredDesigns = useMemo(
    () => getDesignsByCategory(designCategory === "all" ? undefined : designCategory, allDesigns),
    [designCategory, allDesigns]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-poppins">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-wider text-neutral-500">
          Shop
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold text-neutral-900 mt-1">
          {view === "designs" ? "Shop by Design" : "All Products"}
        </h1>
        <p className="text-neutral-500 mt-2 max-w-xl">
          {view === "designs" ? (
            <>Pick a design you like, then choose the garment, color and size on the next screen.</>
          ) : (
            <>
              Ready-made styles across every category — or head to{" "}
              <Link href="/customize" className="underline text-neutral-800">
                Customize
              </Link>{" "}
              to build your own from scratch.
            </>
          )}
        </p>
      </div>

      {/* Products / Designs toggle */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setView("products")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            view === "products"
              ? "bg-neutral-900 text-white"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          }`}
        >
          <Shirt className="w-4 h-4" /> Products
        </button>
        <button
          onClick={() => setView("designs")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            view === "designs"
              ? "bg-neutral-900 text-white"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          }`}
        >
          <Palette className="w-4 h-4" /> Designs
        </button>
      </div>

      {view === "products" ? (
        <>
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2 mb-10 border-b border-neutral-200 pb-6">
            <button
              onClick={() => setCategory("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === "all"
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              All
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.slug}
                onClick={() => setCategory(c.slug)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === c.slug
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {products.map((p) => (
              <div key={p.id} className="group">
                <Link href={`/customize?product=${p.id}`}>
                  <div className="relative overflow-hidden rounded-xl bg-neutral-100 aspect-[3/4]">
                    <img
                      className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0"
                      src={p.image}
                      alt={p.name}
                    />
                    {p.hoverImage && (
                      <img
                        src={p.hoverImage}
                        alt={p.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      />
                    )}
                    {p.tag && (
                      <span className="absolute top-3 left-3 bg-neutral-900 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
                        {p.tag}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        quickAdd(p);
                      }}
                      className="absolute bottom-3 right-3 bg-white text-neutral-900 text-xs font-semibold px-3 py-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neutral-900 hover:text-white"
                    >
                      {addedId === p.id ? "Added ✓" : "Quick Add"}
                    </button>
                  </div>
                </Link>
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/customize?product=${p.id}`}>
                      <p className="text-sm font-medium text-neutral-900">
                        {p.name}
                      </p>
                    </Link>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {p.colors.map((c) => (
                        <span
                          key={c}
                          className="w-3.5 h-3.5 rounded-full border border-neutral-300"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-neutral-900">
                      ₹{p.price}
                    </p>
                    {p.compareAt && (
                      <p className="text-xs text-neutral-400 line-through">
                        ₹{p.compareAt}
                      </p>
                    )}
                  </div>
                </div>
                <Link
                  href={`/customize?product=${p.id}`}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-900"
                >
                  <Palette className="w-3.5 h-3.5" /> Customize this
                </Link>
              </div>
            ))}
          </div>

          {products.length === 0 && (
            <p className="text-center text-neutral-500 py-20">
              No products in this category yet.
            </p>
          )}
        </>
      ) : (
        <>
          {/* Design category tabs */}
          <div className="flex flex-wrap gap-2 mb-10 border-b border-neutral-200 pb-6">
            <button
              onClick={() => setCategory("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === "all"
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              All
            </button>
            {allDesignCategories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === c
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {loadingDesigns && supabaseDesigns.length === 0 && (
            <p className="text-xs text-neutral-400 mb-4">Loading designs…</p>
          )}

          {/* Design grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
            {filteredDesigns.map((d) => (
              <Link
                key={d.id}
                href={`/customize?designSrc=${encodeURIComponent(d.src)}&designName=${encodeURIComponent(d.name)}`}
                className="group"
              >
                <div className="relative overflow-hidden rounded-xl bg-neutral-100 aspect-square border border-neutral-200 group-hover:border-neutral-400 transition-colors">
                  <img
                    src={d.src}
                    alt={d.name}
                    className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-neutral-900/0 group-hover:bg-neutral-900/80 transition-colors flex items-center justify-center py-0 group-hover:py-2 overflow-hidden">
                    <span className="text-white text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      Put this on a shirt →
                    </span>
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium text-neutral-900 truncate">{d.name}</p>
                <p className="text-xs text-neutral-400">{d.category}</p>
              </Link>
            ))}
          </div>

          {filteredDesigns.length === 0 && !loadingDesigns && (
            <p className="text-center text-neutral-500 py-20">
              No designs in this category yet.
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center">Loading…</div>}>
      <ShopContent />
    </Suspense>
  );
}
