"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, MousePointer2, Images, Type } from "lucide-react";
import type { Design } from "@/lib/types";
import { formatPrice, garmentColors, garmentFor, visibleLocations, type Pricing } from "@/lib/garments";
import { readableOn } from "@/lib/text-art";
import { FIXED_PRINT_SPEC, fixedPrintFor, getLocation, placementFromTop } from "@/lib/print-locations";
import { markHeroReady } from "@/lib/intro";

const TShirtViewer = dynamic(() => import("@/components/TShirtViewer"), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center text-sm text-white/40">Loading 3D…</div>,
});


/** How often the hero carousel moves on to the next design */
const CAROUSEL_MS = 7000;

/** The hero shirt's two print slots (see HeroPlayground) */
type Slot = "a" | "b";

/** Renders a word/phrase to a transparent PNG for the live 3D preview. */
function renderWord(text: string, color: string) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 3);
  if (!lines.length) return null;
  const family = getComputedStyle(document.documentElement).getPropertyValue("--font-poppins").trim() || "sans-serif";
  const size = 200;
  const lh = size * 1.02;
  const pad = size * 0.12;
  const font = `900 ${size}px ${family}`;
  const m = document.createElement("canvas").getContext("2d")!;
  m.font = font;
  const w = Math.max(...lines.map((l) => m.measureText(l.toUpperCase()).width));
  const c = document.createElement("canvas");
  c.width = Math.ceil(w + pad * 2);
  c.height = Math.ceil(lh * lines.length + pad * 2);
  const ctx = c.getContext("2d")!;
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  lines.forEach((l, i) => ctx.fillText(l.toUpperCase(), c.width / 2, pad + lh * (i + 0.5)));
  return { src: c.toDataURL("image/png"), aspect: c.width / c.height };
}

export default function HeroPlayground({ designs, pricing }: { designs: Design[]; pricing: Pricing }) {
  const [mode, setMode] = useState<"design" | "text">("design");
  // `designId` is the picked thumbnail. The shirt holds two print slots: the
  // one on show, and one where the next design is loaded and built onto the
  // fabric out of sight. Only once it's ready does the shirt spin, and the
  // halfway swap just flips which slot is visible — nothing heavy mid-turn.
  // The hero shows the oversized tee, in the colours the admin offers for it.
  const heroGarment = garmentFor(pricing, "oversized-tee");
  const heroColors = useMemo(() => garmentColors(pricing, heroGarment.slug), [pricing, heroGarment.slug]);
  const [color, setColor] = useState(heroColors[0].hex);
  /** Shirt colour the carousel swaps in at the next halfway point */
  const [nextColor, setNextColor] = useState<string | null>(null);

  const [designId, setDesignId] = useState(designs[0]?.id ?? "");
  const [slots, setSlots] = useState<{ front: Slot; ids: Record<Slot, string | null> }>({
    front: "a",
    ids: { a: designs[0]?.id ?? null, b: null },
  });
  const front = slots.front;
  const back: Slot = front === "a" ? "b" : "a";
  const frontId = slots.ids[front];
  /** The turn in progress: which slot and design it reveals at halfway */
  const [turning, setTurning] = useState<{ slot: Slot; id: string } | null>(null);
  const [spin, setSpin] = useState(0);
  const pickDesign = (id: string) => {
    if (id === designId) return;
    setDesignId(id);
    setNextColor(null); // a visitor's pick keeps their colour
  };
  const onSpinHalfway = useCallback(() => {
    if (!turning) return;
    // Show the new design; empty the other slot so the next one loads fresh.
    const other: Slot = turning.slot === "a" ? "b" : "a";
    setSlots({ front: turning.slot, ids: { [turning.slot]: turning.id, [other]: null } as Record<Slot, string | null> });
    setTurning(null);
    // A carousel change also swaps the shirt colour, out of sight like the print
    if (nextColor) {
      setColor(nextColor);
      setNextColor(null);
    }
  }, [turning, nextColor]);

  // Carousel: every 7s a random other design spins in, on a random other
  // shirt colour. Picking a design restarts the wait (and keeps the visitor's
  // colour); it pauses while the visitor is trying out text.
  useEffect(() => {
    if (mode !== "design" || designs.length < 2) return;
    const t = setTimeout(() => {
      const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
      setDesignId(pick(designs.filter((d) => d.id !== designId)).id);
      const others = heroColors.filter((c) => c.hex !== color);
      if (others.length) setNextColor(pick(others).hex);
    }, CAROUSEL_MS);
    return () => clearTimeout(t);
  }, [mode, designs, designId, heroColors, color]);
  const [text, setText] = useState("YOUR TEXT");
  const [textArt, setTextArt] = useState<{ src: string; aspect: number } | null>(null);

  const design = designs.find((d) => d.id === designId);
  const ink = readableOn(color);

  // Live text → texture, debounced so typing stays smooth.
  useEffect(() => {
    if (mode !== "text") return;
    const t = setTimeout(() => setTextArt(renderWord(text, ink)), 180);
    return () => clearTimeout(t);
  }, [mode, text, ink]);


  // Print where store designs print by default (front, or back if front is hidden).
  const areaIds = visibleLocations(pricing).map((l) => l.id).join(",");
  const spot = useMemo(() => fixedPrintFor(areaIds.split(",")), [areaIds]);
  const areaCount = visibleLocations(pricing).length;
  const areaLabels = `${areaCount} print area${areaCount === 1 ? "" : "s"}`;
  // Real shape of each design image, so its top edge lands exactly 5.5″ below the shoulder.
  const [aspects, setAspects] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!design || aspects[design.id]) return;
    const img = new Image();
    img.onload = () =>
      img.naturalWidth && img.naturalHeight &&
      setAspects((a) => ({ ...a, [design.id]: img.naturalWidth / img.naturalHeight }));
    img.src = design.image;
  }, [design, aspects]);

  // The hidden slot holds the newly picked design once its shape is known
  // (during a turn: the design being revealed).
  const wanted = mode === "design" && designId !== frontId && aspects[designId] ? designId : null;
  const backId = turning ? turning.id : wanted ?? slots.ids[back];
  // The hidden slot's print is built onto the fabric: turn to reveal it.
  const onPrintLoaded = useCallback(
    (slot: string) => {
      if (slot !== back || !wanted || backId !== wanted || turning) return;
      setTurning({ slot: back, id: wanted });
      setSpin((n) => n + 1);
    },
    [back, wanted, backId, turning]
  );

  const shown = designs.find((d) => d.id === frontId);
  const src = mode === "design" ? shown?.image : textArt?.src;
  const prints = useMemo(() => {
    const loc = getLocation(spot.location)!;
    if (mode === "text") {
      if (!textArt) return [];
      // Wider words get a wider print (up to 13″), same 5.5″ top edge.
      const widthIn = Math.min(13, 9 * Math.max(1, textArt.aspect / 2.2));
      const placement =
        loc.view === "front" || loc.view === "back"
          ? placementFromTop(loc, widthIn, textArt.aspect, FIXED_PRINT_SPEC.topIn)
          : spot.placement;
      return [{ id: "text", location: spot.location, src: textArt.src, placement }];
    }
    return (["a", "b"] as const).flatMap((slot) => {
      const d = designs.find((x) => x.id === (slot === front ? frontId : backId));
      if (!d) return [];
      const placement = fixedPrintFor([spot.location], aspects[d.id] ?? 1).placement;
      return [{ id: slot, location: spot.location, src: d.image, placement, hidden: slot !== front }];
    });
  }, [mode, textArt, spot, designs, front, frontId, backId, aspects]);

  const base = heroGarment.basePrice;
  const price = base + (src ? pricing.location[spot.location] : 0) + (mode === "design" ? design?.price ?? 0 : 0);
  const studioHref =
    mode === "design" && design
      ? `/customize?design=${design.slug}&garment=${heroGarment.slug}&color=${encodeURIComponent(color)}`
      : `/customize?mode=text&text=${encodeURIComponent(text)}&garment=${heroGarment.slug}&color=${encodeURIComponent(color)}`;

  return (
    <section className="relative bg-ink text-white overflow-hidden">
      {/* Atmosphere */}
      <div className="absolute inset-0 grain opacity-[0.15] pointer-events-none" />
      <div className="absolute right-[8%] top-[18%] w-[520px] h-[520px] rounded-full bg-flame/35 blur-[120px] pointer-events-none" />
      <div className="absolute right-[30%] bottom-[-10%] w-[380px] h-[380px] rounded-full bg-lime/15 blur-[110px] pointer-events-none" />
      <p
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2 bottom-[-2vw] font-black uppercase leading-none tracking-[-0.06em] text-[24vw] text-transparent select-none pointer-events-none whitespace-nowrap"
        style={{ WebkitTextStroke: "1px rgba(255,255,255,0.08)" }}
      >
        RAD.CLO
      </p>

      <div className="relative max-w-7xl mx-auto px-6 pt-12 pb-24 lg:pt-16 lg:pb-28 grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[1fr_1.15fr] gap-10 items-center">
        {/* Copy */}
        <div data-intro-reveal className="text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/5 ring-1 ring-white/15 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em]">
            <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" /> Custom t-shirt printing · Nepal
          </span>
          <h1 className="font-black uppercase leading-[0.9] tracking-[-0.045em] text-[clamp(52px,7.2vw,112px)] mt-6">
            Your art.
            <br />
            Your tee.
            <br />
            <span className="relative inline-block text-ink">
              <span className="absolute inset-x-[-0.08em] inset-y-[0.08em] bg-lime -rotate-2 rounded-md" />
              <span className="relative">In 3D.</span>
            </span>
          </h1>
          <p className="text-white/60 text-base md:text-lg mt-7 max-w-md mx-auto lg:mx-0 leading-relaxed">
            Custom t-shirts printed in Nepal. Shop our original prints or bring your own, place it on the front, back or
            sleeves, watch it come to life on a 3D shirt — we print and deliver across Nepal.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-9 justify-center lg:justify-start">
            <Link
              href="/customize"
              className="group inline-flex items-center justify-center gap-2 bg-lime text-ink font-bold text-sm px-7 py-4 rounded-full hover:bg-white transition-colors"
            >
              Start designing <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 ring-1 ring-white/25 font-bold text-sm px-7 py-4 rounded-full hover:bg-white/10 transition-colors"
            >
              Shop designs
            </Link>
          </div>
        </div>

        {/* 3D playground */}
        <div data-intro-reveal className="relative">
          <div className="relative h-[440px] sm:h-[560px] lg:h-[620px]">
            <TShirtViewer
              color={color}
              prints={prints}
              view={spot.location === "back" ? "back" : "front"}
              autoRotate={false}
              onReady={markHeroReady}
              spin={spin}
              onSpinHalfway={onSpinHalfway}
              onPrintLoaded={onPrintLoaded}
              slant={-18}
              // Whole shirt at rest; zooms in during a design change, then back out
              spinDistance={3.0}
            />
            <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur px-3 py-1.5 text-[11px] font-semibold pointer-events-none">
              <MousePointer2 className="w-3.5 h-3.5" /> Drag to spin
            </span>
            <span className="hidden sm:block absolute top-10 right-2 rotate-6 rounded-xl bg-white text-ink px-3 py-2 text-[11px] font-black uppercase shadow-xl pointer-events-none">
              {areaLabels}
            </span>
            <span className="hidden sm:block absolute bottom-40 -left-2 -rotate-6 rounded-xl bg-flame text-white px-3 py-2 text-[11px] font-black uppercase shadow-xl pointer-events-none">
              No minimum order
            </span>
          </div>

          {/* Control dock */}
          <div className="relative -mt-24 mx-auto max-w-xl rounded-[26px] bg-white/[0.07] backdrop-blur-xl ring-1 ring-white/15 p-3 shadow-2xl">
            <div className="flex items-center gap-2">
              <div className="flex rounded-full bg-black/30 p-1">
                {(
                  [
                    ["design", "Designs", Images],
                    ["text", "Your text", Type],
                  ] as const
                ).map(([m, label, Icon]) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${
                      mode === m ? "bg-white text-ink" : "text-white/70 hover:text-white"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5 ml-auto pr-1">
                {heroColors.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => {
                      setColor(c.hex);
                      setNextColor(null); // the visitor's choice wins over a pending carousel colour
                    }}
                    aria-label={c.label}
                    title={c.label}
                    className={`w-6 h-6 rounded-full ring-1 ring-white/30 transition-transform ${
                      color === c.hex ? "scale-125 ring-2 ring-lime" : "hover:scale-110"
                    }`}
                    style={{ background: c.hex }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-3">
              {mode === "design" ? (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {designs.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => pickDesign(d.id)}
                      title={d.name}
                      className={`shrink-0 w-14 h-14 rounded-2xl bg-white p-1.5 transition-all ${
                        designId === d.id ? "ring-[3px] ring-lime scale-105" : "opacity-70 hover:opacity-100"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={d.image} alt={d.name} className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, 22))}
                  placeholder="Type anything…"
                  className="w-full rounded-2xl bg-white text-ink font-black uppercase text-lg tracking-tight px-4 py-3 focus:outline-none focus:ring-[3px] focus:ring-lime"
                  aria-label="Text to print"
                />
              )}
            </div>

            <div className="flex items-center justify-between gap-3 mt-3 pl-2">
              <div>
                <p className="text-[11px] text-white/50 uppercase tracking-wider font-semibold">
                  {mode === "design" ? design?.name ?? "Pick a design" : "Custom text tee"}
                </p>
                <p className="font-black text-xl tracking-tight">{formatPrice(price)}</p>
              </div>
              <Link
                href={studioHref}
                className="group inline-flex items-center gap-2 rounded-full bg-lime text-ink text-xs font-bold px-5 py-3 hover:bg-white transition-colors"
              >
                Customize this <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
