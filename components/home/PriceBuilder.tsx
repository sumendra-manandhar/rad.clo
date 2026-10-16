"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Minus, Plus, Users } from "lucide-react";
import { PrintAreaPicker, PrintAreasLegend } from "@/components/PrintAreas";
import {
  formatPrice,
  shippingFor,
  visibleGarments,
  visibleLocations,
  FREE_SHIPPING_FROM,
  type Pricing,
} from "@/lib/garments";

/** Animated number that counts toward its target. */
function useCountUp(target: number) {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / 450);
      const eased = 1 - Math.pow(1 - k, 3);
      const v = Math.round(a + (target - a) * eased);
      setValue(v);
      from.current = v;
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return value;
}

export default function PriceBuilder({ pricing }: { pricing: Pricing }) {
  const garments = visibleGarments(pricing);
  const locations = visibleLocations(pricing);
  const [garment, setGarment] = useState(garments[0].slug);
  const [areas, setAreas] = useState<string[]>([locations[0].id]);
  const [qty, setQty] = useState(1);

  const toggle = (id: string) => setAreas((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  const unit = pricing.garment[garment] + areas.reduce((s, id) => s + pricing.location[id], 0);
  const subtotal = unit * qty;
  const total = subtotal + shippingFor(subtotal);
  const shown = useCountUp(total);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[1.15fr_1fr] gap-4">
      {/* Builder */}
      <div className="rounded-[32px] bg-white ring-1 ring-black/5 p-6 sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">1 · Garment</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {garments.map((g) => (
            <button
              key={g.slug}
              onClick={() => setGarment(g.slug)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                garment === g.slug ? "bg-ink text-white" : "bg-paper hover:bg-ink/10"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        <div className="flex items-baseline justify-between gap-3 mt-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">2 · Tap where to print</p>
          <p className="text-[11px] text-muted">{areas.length} area{areas.length === 1 ? "" : "s"} picked</p>
        </div>
        <div className="grid sm:grid-cols-[1.15fr_1fr] gap-4 mt-3 items-start">
          <div className="rounded-2xl bg-paper p-3">
            <PrintAreaPicker locations={locations} selected={areas} onToggle={toggle} prices={pricing.location} />
          </div>
          <PrintAreasLegend locations={locations} prices={pricing.location} used={areas} onToggle={toggle} columns={1} />
        </div>

        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted mt-8">3 · Quantity</p>
        <div className="flex items-center gap-4 mt-3">
          <div className="inline-flex items-center rounded-full bg-paper">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3" aria-label="Fewer">
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-10 text-center font-black text-lg tabular-nums">{qty}</span>
            <button onClick={() => setQty((q) => Math.min(500, q + 1))} className="p-3" aria-label="More">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={Math.min(qty, 100)}
            onChange={(e) => setQty(Number(e.target.value))}
            className="flex-1 accent-ink"
            aria-label="Quantity"
          />
        </div>
      </div>

      {/* Total */}
      <div className="relative rounded-[32px] bg-ink text-white p-6 sm:p-8 overflow-hidden flex flex-col">
        <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-flame/40 blur-3xl" />
        <p className="relative text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">Your total</p>
        <p className="relative font-black tracking-[-0.05em] text-[clamp(56px,7vw,96px)] leading-none mt-4 tabular-nums">
          {formatPrice(shown)}
        </p>
        <div className="relative mt-6 space-y-2 text-sm text-white/70">
          <Line label={garments.find((g) => g.slug === garment)?.label ?? ""} value={formatPrice(pricing.garment[garment])} />
          {areas.map((id) => (
            <Line key={id} label={`${locations.find((l) => l.id === id)?.label} print`} value={`+${formatPrice(pricing.location[id])}`} />
          ))}
          <Line label={`× ${qty}`} value={formatPrice(subtotal)} />
          <Line label="Shipping" value={shippingFor(subtotal) ? formatPrice(shippingFor(subtotal)) : "Free"} />
        </div>
        <p className="relative text-xs text-white/40 mt-4">
          {subtotal < FREE_SHIPPING_FROM
            ? `Add ${formatPrice(FREE_SHIPPING_FROM - subtotal)} more for free shipping.`
            : "You get free shipping."}{" "}
          Store designs add their own price.
        </p>
        {qty >= 20 && (
          <Link
            href="/contact#quote"
            className="relative mt-4 flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm hover:bg-white/15 transition-colors"
          >
            <Users className="w-4 h-4 text-lime shrink-0" />
            <span>
              Ordering {qty}? <span className="font-semibold underline">Get a bulk quote</span> — tiered pricing for teams & events.
            </span>
          </Link>
        )}
        <Link
          href={`/customize?garment=${garment}`}
          className="relative group mt-auto pt-8 inline-flex"
        >
          <span className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-lime text-ink font-bold text-sm py-4 group-hover:bg-white transition-colors">
            Design this tee <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/10 pb-2">
      <span className="truncate">{label}</span>
      <span className="text-white font-semibold">{value}</span>
    </div>
  );
}
