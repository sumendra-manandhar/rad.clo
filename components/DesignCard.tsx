import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Design } from "@/lib/types";
import { formatPrice } from "@/lib/garments";

export default function DesignCard({
  design,
  categoryName,
  fromPrice,
}: {
  design: Design;
  categoryName?: string;
  /** Cheapest garment + print location + this design */
  fromPrice: number;
}) {
  return (
    <Link href={`/customize?design=${design.slug}`} className="group block">
      <div className="relative aspect-square rounded-2xl bg-white border border-line overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element -- admin-uploaded images of unknown size/host */}
        <img
          src={design.image}
          alt={design.name}
          loading="lazy"
          className="w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
        />
        {design.featured && (
          <span className="absolute top-3 left-3 bg-lime text-ink text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
            Bestseller
          </span>
        )}
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 bg-ink text-paper text-xs font-semibold pl-3 pr-2 py-1.5 rounded-full opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
          Try in 3D <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold truncate">{design.name}</p>
          {categoryName && <p className="text-xs text-muted mt-0.5">{categoryName}</p>}
        </div>
        <p className="text-sm font-semibold shrink-0">
          <span className="text-muted font-normal text-xs">from </span>
          {formatPrice(fromPrice)}
        </p>
      </div>
    </Link>
  );
}
