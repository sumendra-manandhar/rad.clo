"use client";

import { useRef } from "react";
import Link from "next/link";
import type { Design } from "@/lib/types";
import { formatPrice } from "@/lib/garments";

/** Design tile that tilts toward the cursor with a moving glare. */
export default function TiltCard({
  design,
  fromPrice,
  categoryName,
  className = "",
}: {
  design: Design;
  fromPrice: number;
  categoryName?: string;
  className?: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - y) * 12}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 14}deg`);
    el.style.setProperty("--gx", `${x * 100}%`);
    el.style.setProperty("--gy", `${y * 100}%`);
  };
  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <Link
      ref={ref}
      href={`/customize?design=${design.slug}`}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className={`group block [perspective:900px] ${className}`}
    >
      <div
        className="relative aspect-square rounded-[24px] bg-white ring-1 ring-black/5 overflow-hidden transition-transform duration-200 ease-out will-change-transform"
        style={{ transform: "rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={design.image}
          alt={design.name}
          loading="lazy"
          className="w-full h-full object-contain p-7 transition-transform duration-500 group-hover:scale-110"
        />
        <span
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{
            background: "radial-gradient(circle at var(--gx,50%) var(--gy,50%), rgba(255,255,255,0.55), transparent 45%)",
          }}
        />
        {design.featured && (
          <span className="absolute top-3 left-3 rotate-[-4deg] rounded-md bg-lime px-2 py-1 text-[10px] font-black uppercase">
            Bestseller
          </span>
        )}
        <span className="absolute bottom-3 inset-x-3 flex items-center justify-between rounded-full bg-ink text-white pl-4 pr-1.5 py-1.5 text-xs font-bold opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
          Try it in 3D
          <span className="rounded-full bg-lime text-ink px-2.5 py-1">→</span>
        </span>
      </div>
      <div className="flex items-start justify-between gap-3 mt-3 px-1">
        <div className="min-w-0">
          <p className="font-bold truncate">{design.name}</p>
          {categoryName && <p className="text-xs text-muted">{categoryName}</p>}
        </div>
        <p className="text-sm font-black shrink-0">
          <span className="text-[10px] font-semibold text-muted">FROM </span>
          {formatPrice(fromPrice)}
        </p>
      </div>
    </Link>
  );
}
