import Link from "next/link";
import { Search, Upload } from "lucide-react";
import { getStorefront } from "@/lib/server/store";
import DesignCard from "@/components/DesignCard";
import { designFromPrice } from "@/lib/garments";

export const metadata = { title: "Shop Designs — Rad.Clo" };

const SORTS = [
  ["popular", "Popular"],
  ["new", "Newest"],
  ["price-asc", "Price: low to high"],
  ["price-desc", "Price: high to low"],
] as const;

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const category = one(sp.category);
  const q = one(sp.q).trim().toLowerCase();
  const sort = one(sp.sort) || "popular";

  const { categories, designs, pricing } = await getStorefront();
  const activeCat = categories.find((c) => c.slug === category);

  let list = designs.filter(
    (d) =>
      (!activeCat || d.category === activeCat.slug) &&
      (!q || d.name.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q))
  );
  list = [...list].sort((a, b) => {
    if (sort === "new") return b.createdAt.localeCompare(a.createdAt);
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    return Number(b.featured) - Number(a.featured) || b.createdAt.localeCompare(a.createdAt);
  });

  const href = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ ...(category && { category }), ...(q && { q }), ...(sort !== "popular" && { sort }), ...patch });
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
    const s = p.toString();
    return s ? `/shop?${s}` : "/shop";
  };
  const catName = (slug: string) => categories.find((c) => c.slug === slug)?.name;
  const counts = Object.fromEntries(categories.map((c) => [c.slug, designs.filter((d) => d.category === c.slug).length]));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Design store</p>
          <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight mt-2">
            {activeCat ? activeCat.name : "All designs"}
          </h1>
          <p className="text-muted mt-3 max-w-lg">
            {activeCat?.description ||
              "Every design can be printed on any tee, polo, hoodie or sweatshirt. Pick one to try it on in 3D."}
          </p>
        </div>
        <form action="/shop" className="relative w-full md:w-80">
          {category && <input type="hidden" name="category" value={category} />}
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search designs…"
            className="w-full rounded-full border border-line bg-white pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-ink"
          />
        </form>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Categories */}
        <aside className="lg:w-56 shrink-0">
          <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
            <CatLink href={href({ category: "" })} active={!activeCat} label="All designs" count={designs.length} />
            {categories.map((c) => (
              <CatLink key={c.id} href={href({ category: c.slug })} active={activeCat?.id === c.id} label={c.name} count={counts[c.slug]} />
            ))}
          </nav>
          <Link
            href="/customize?mode=upload"
            className="hidden lg:flex mt-8 rounded-2xl bg-ink text-paper p-5 flex-col gap-3 hover:bg-flame transition-colors"
          >
            <Upload className="w-5 h-5 text-lime" />
            <span className="font-semibold">Have your own design?</span>
            <span className="text-xs text-paper/60">Upload it in the 3D studio →</span>
          </Link>
        </aside>

        {/* Grid */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6 gap-4">
            <p className="text-sm text-muted">
              {list.length} design{list.length === 1 ? "" : "s"}
              {q && <> for “{q}”</>}
            </p>
            <div className="flex gap-1 overflow-x-auto">
              {SORTS.map(([key, label]) => (
                <Link
                  key={key}
                  href={href({ sort: key === "popular" ? "" : key })}
                  className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                    sort === key ? "bg-ink text-paper" : "hover:bg-ink/5"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {list.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8">
              {list.map((d) => (
                <DesignCard key={d.id} design={d} categoryName={catName(d.category)} fromPrice={designFromPrice(d.price, pricing)} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-line py-20 text-center">
              <p className="font-semibold">No designs found.</p>
              <p className="text-sm text-muted mt-1">Try another category, or upload your own artwork.</p>
              <Link href="/customize?mode=upload" className="inline-block mt-5 bg-ink text-paper text-sm font-semibold px-5 py-2.5 rounded-full">
                Upload your design
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CatLink({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link
      href={href}
      className={`shrink-0 flex items-center justify-between gap-3 rounded-full lg:rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
        active ? "bg-ink text-paper" : "bg-white border border-line lg:border-transparent lg:bg-transparent hover:bg-ink/5"
      }`}
    >
      {label}
      <span className={`text-xs ${active ? "text-paper/60" : "text-muted"}`}>{count}</span>
    </Link>
  );
}
