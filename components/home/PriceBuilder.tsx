"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Minus, Plus } from "lucide-react";
import {
  formatPrice,
  shippingFor,
  visibleGarments,
  visibleLocations,
  FREE_SHIPPING_FROM,
  type Pricing,
} from "@/lib/garments";

const TEE = "M40,34 L74,10 Q100,0 126,10 L160,34 L192,66 L172,86 L154,68 L154,232 L46,232 L46,68 L28,86 L8,66 Z";

// Clickable print areas on the two mini tees (front at x=0, back at x=220).
const HOTSPOTS: Record<string, { x: number; y: number; w: number; h: number; side: 0 | 1 }> = {
  front: { x: 62, y: 46, w: 76, h: 96, side: 0 },
  "left-sleeve": { x: 160, y: 46, w: 22, h: 22, side: 0 },
  "right-sleeve": { x: 18, y: 46, w: 22, h: 22, side: 0 },
  back: { x: 62, y: 40, w: 76, h: 96, side: 1 },
};

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
    <div className="grid lg:grid-cols-[1.15fr_1fr] gap-4">
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

        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted mt-8">2 · Tap where to print</p>
        <svg viewBox="0 0 420 250" className="w-full max-w-lg mt-3 select-none" role="group" aria-label="Print areas">
          {[0, 1].map((side) => (
            <g key={side} transform={`translate(${side * 220},0)`}>
              <path d={TEE} fill="#eef2f7" stroke="#11111126" strokeWidth="2" strokeLinejoin="round" />
              <path d={side ? "M82,12 Q100,20 118,12" : "M82,12 Q100,34 118,12"} fill="none" stroke="#11111133" strokeWidth="2" />
              <text x="100" y="222" textAnchor="middle" fontSize="11" fontWeight="800" fill="#11111166" letterSpacing="2">
                {side ? "BACK" : "FRONT"}
              </text>
            </g>
          ))}
          {locations.map((loc) => {
            const h = HOTSPOTS[loc.id];
            if (!h) return null;
            const on = areas.includes(loc.id);
            return (
              <g
                key={loc.id}
                transform={`translate(${h.side * 220},0)`}
                onClick={() => toggle(loc.id)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), toggle(loc.id))}
                role="checkbox"
                aria-checked={on}
                aria-label={`${loc.label} print, ${formatPrice(pricing.location[loc.id])}`}
                tabIndex={0}
                className="cursor-pointer outline-none group"
              >
                <rect
                  x={h.x}
                  y={h.y}
                  width={h.w}
                  height={h.h}
                  rx="6"
                  fill={on ? "#d4ff3a" : "#ffffff"}
                  stroke={on ? "#111" : "#11111155"}
                  strokeWidth="2"
                  strokeDasharray={on ? "0" : "5 4"}
                  className="transition-all group-hover:stroke-[#111] group-focus-visible:stroke-[#2f6bff]"
                />
                <text
                  x={h.x + h.w / 2}
                  y={h.y + h.h / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={h.w > 40 ? 22 : 13}
                  fontWeight="900"
                  fill="#111"
                  className="pointer-events-none"
                >
                  {on ? "✓" : "+"}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="flex flex-wrap gap-2 mt-2">
          {locations.map((l) => (
            <button
              key={l.id}
              onClick={() => toggle(l.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 transition-colors ${
                areas.includes(l.id) ? "bg-lime ring-ink" : "ring-ink/15 text-ink/60 hover:text-ink"
              }`}
            >
              {l.label} +{formatPrice(pricing.location[l.id])}
            </button>
          ))}
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
