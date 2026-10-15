"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Category, Design } from "@/lib/types";
import { designFromPrice, type Pricing } from "@/lib/garments";
import TiltCard from "@/components/home/TiltCard";

/** "The Drop": pick a category on the left, its designs swap in on the right. */
export default function CategoryExplorer({
  categories,
  designs,
  pricing,
}: {
  categories: Category[];
  designs: Design[];
  pricing: Pricing;
}) {
  const cats = categories.filter((c) => designs.some((d) => d.category === c.slug));
  const [active, setActive] = useState(cats[0]?.slug ?? "");
  const list = designs.filter((d) => d.category === active).slice(0, 6);
  const current = cats.find((c) => c.slug === active);

  if (!cats.length) return null;

  return (
    <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.6fr)] gap-10">
      <div>
        <ul className="flex lg:flex-col gap-2 lg:gap-0 overflow-x-auto -mx-6 px-6 lg:mx-0 lg:px-0 pb-2 lg:pb-0">
          {cats.map((c, i) => {
            const on = c.slug === active;
            const count = designs.filter((d) => d.category === c.slug).length;
            return (
              <li key={c.id} className="shrink-0">
                <button
                  onMouseEnter={() => setActive(c.slug)}
                  onFocus={() => setActive(c.slug)}
                  onClick={() => setActive(c.slug)}
                  className={`group w-full flex items-baseline gap-4 text-left rounded-full lg:rounded-none px-4 lg:px-0 py-2 lg:py-3 lg:border-b border-ink/10 transition-colors ${
                    on ? "bg-ink text-white lg:bg-transparent lg:text-ink" : "bg-white lg:bg-transparent text-ink/35 hover:text-ink"
                  }`}
                >
                  <span className="hidden lg:inline text-xs font-bold tabular-nums w-6">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-black uppercase tracking-[-0.04em] text-base lg:text-[clamp(30px,3.4vw,52px)] leading-none whitespace-nowrap">
                    {c.name}
                  </span>
                  <span className="text-xs font-bold lg:ml-auto">{count}</span>
                  <ArrowUpRight
                    className={`hidden lg:block w-6 h-6 self-center transition-all ${on ? "opacity-100 rotate-45" : "opacity-0"}`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
        {current?.description && <p className="hidden lg:block text-muted mt-6 max-w-xs">{current.description}.</p>}
        <Link
          href={`/shop?category=${active}`}
          className="hidden lg:inline-flex items-center gap-2 mt-6 rounded-full bg-ink text-white text-xs font-bold px-5 py-3 hover:bg-flame transition-colors"
        >
          SHOP {current?.name.toUpperCase()} <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      <div key={active} className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-7 animate-[fadeUp_0.45s_ease-out]">
        {list.map((d) => (
          <TiltCard key={d.id} design={d} fromPrice={designFromPrice(d.price, pricing)} categoryName={current?.name} />
        ))}
      </div>
    </div>
  );
}
