"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { introHasPlayed, onHeroReady, setIntroPlayed } from "@/lib/intro";

const WORD = ["R", "a", "d", ".", "C", "l", "o"];
const TAGS = ["Front", "Back", "Sleeves", "Live 3D"];
// Print-shop steps shown under the counter as loading progresses
const STEPS: [number, string][] = [
  [0, "Stretching the screen…"],
  [30, "Mixing the inks…"],
  [60, "Pulling the squeegee…"],
  [90, "Curing the print…"],
  [100, "Fresh off the press."],
];
// Tee silhouette (viewBox 0 0 200 200), hem at y=180, shoulders at y≈22
const TEE =
  "M72 22 L40 32 L8 62 L30 90 L50 76 L50 180 L150 180 L150 76 L170 90 L192 62 L160 32 L128 22 Q118 42 100 42 Q82 42 72 22 Z";
const HEM = 180;
const TOP = 20;
const MIN_MS = 1400; // always show the intro this long, so it doesn't flash
const MAX_MS = 10000; // never block the page longer than this

/**
 * Full-screen intro on the first load of the homepage. Covers the page
 * (it's in the server HTML, so the half-loaded page never flashes) until the
 * 3D shirt has drawn its first frame and the fonts are in, then wipes away.
 */
export default function IntroLoader() {
  const [done, setDone] = useState(introHasPlayed);
  const root = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const ink = useRef<SVGRectElement>(null);
  const squeegee = useRef<SVGGElement>(null);
  const step = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (done || !root.current) return;
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const started = performance.now();
    const progress = { v: 0 };
    const draw = () => {
      if (count.current) count.current.textContent = String(Math.round(progress.v)).padStart(3, "0");
      if (bar.current) bar.current.style.transform = `scaleX(${progress.v / 100})`;
      // Ink fills the tee from the hem up; the squeegee rides the ink line
      const y = HEM - ((HEM - TOP) * progress.v) / 100;
      ink.current?.setAttribute("y", String(y));
      squeegee.current?.setAttribute("transform", `translate(0 ${y})`);
      const label = [...STEPS].reverse().find(([at]) => progress.v >= at)?.[1] ?? "";
      if (step.current && step.current.textContent !== label) step.current.textContent = label;
    };
    let finished = false;
    let unsubscribe = () => {};

    const ctx = gsap.context(() => {
      gsap.set(".intro-hide", { visibility: "visible" });
      gsap
        .timeline()
        .fromTo(".intro-outline", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut" })
        .from(".intro-tee", { scale: 0.85, rotate: -6, duration: 1.1, ease: "power3.out" }, "<")
        .from(".intro-letter", { yPercent: 110, duration: 0.8, stagger: 0.05, ease: "power4.out" }, "-=0.7")
        .from(".intro-tag", { opacity: 0, y: 12, duration: 0.5, stagger: 0.06, ease: "power2.out" }, "-=0.45")
        .from(".intro-foot", { opacity: 0, duration: 0.4 }, "<");
      // Creeps towards 90% while waiting; the last 10% happens when the shirt is ready.
      gsap.to(progress, { v: 90, duration: 4, ease: "power2.out", onUpdate: draw });
    }, root);

    const finish = () => {
      if (finished) return;
      finished = true;
      const wait = Math.max(0, MIN_MS - (performance.now() - started)) / 1000;
      ctx.add(() => {
        gsap.killTweensOf(progress);
        const tl = gsap.timeline({
          delay: wait,
          onComplete: () => {
            html.style.overflow = prevOverflow;
            setIntroPlayed();
            setDone(true);
          },
        });
        tl.to(progress, { v: 100, duration: 0.45, ease: "power2.inOut", onUpdate: draw });
        if (reduce) {
          tl.to(root.current, { opacity: 0, duration: 0.3 });
          return;
        }
        tl.to(".intro-tee", { y: -30, rotate: 4, opacity: 0, duration: 0.55, ease: "power3.in" }, "+=0.15")
          .to(".intro-letter", { yPercent: -110, duration: 0.55, stagger: 0.03, ease: "power3.in" }, "<0.05")
          .to([".intro-tag", ".intro-foot"], { opacity: 0, duration: 0.3 }, "<")
          .to(".intro-panel", { yPercent: -100, duration: 0.9, stagger: { each: 0.1, from: "end" }, ease: "expo.inOut" }, "-=0.15");
        // Hero content rises slightly as the curtain lifts
        const reveal = document.querySelectorAll("[data-intro-reveal]");
        if (reveal.length)
          tl.from(reveal, { y: 48, opacity: 0, duration: 1, stagger: 0.12, ease: "power3.out", clearProps: "all" }, "-=0.5");
      });
    };

    const fonts = document.fonts?.ready ?? Promise.resolve();
    const hero = new Promise<void>((resolve) => {
      unsubscribe = onHeroReady(resolve);
    });
    Promise.all([fonts, hero]).then(finish);
    const cap = window.setTimeout(finish, MAX_MS);

    return () => {
      window.clearTimeout(cap);
      unsubscribe();
      ctx.revert();
      html.style.overflow = prevOverflow;
    };
  }, [done]);

  if (done) return null;

  return (
    <div
      ref={root}
      role="status"
      aria-live="polite"
      aria-label="Loading Rad.Clo"
      className="fixed inset-0 z-[100] text-paper select-none"
    >
      {/* Two stacked curtains: the lime one trails the dark one on the way out */}
      <div className="intro-panel absolute inset-0 bg-lime" />
      <div className="intro-panel absolute inset-0 bg-ink flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          {/* A tee being screen-printed: outline draws on, then lime ink fills it */}
          <svg
            viewBox="0 0 200 200"
            aria-hidden
            style={{ visibility: "hidden" }}
            className="intro-hide intro-tee w-36 sm:w-48 lg:w-56 mb-4 overflow-visible"
          >
            <defs>
              <clipPath id="intro-tee-clip">
                <path d={TEE} />
              </clipPath>
            </defs>
            <path d={TEE} className="fill-paper/[0.04]" />
            <g clipPath="url(#intro-tee-clip)">
              <rect ref={ink} x="0" y={HEM} width="200" height="200" className="fill-lime" />
              {/* Halftone dots on the fresh ink */}
              <g className="fill-ink/15">
                {Array.from({ length: 48 }, (_, i) => (
                  <circle key={i} cx={56 + (i % 8) * 12.5 + (Math.floor(i / 8) % 2) * 6} cy={92 + Math.floor(i / 8) * 13} r="2.2" />
                ))}
              </g>
            </g>
            <path
              d={TEE}
              pathLength={1}
              strokeDasharray="1"
              className="intro-outline fill-none stroke-paper"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Squeegee */}
            <g ref={squeegee} transform={`translate(0 ${HEM})`}>
              <rect x="22" y="-3" width="156" height="6" rx="3" className="fill-flame" />
              <rect x="94" y="-14" width="12" height="12" rx="2" className="fill-flame/70" />
            </g>
          </svg>
          <p style={{ visibility: "hidden" }} className="intro-hide flex overflow-hidden font-hero font-black tracking-[-0.06em] leading-[0.9] text-[16vw] sm:text-[10vw] lg:text-[7.5rem]">
            {WORD.map((ch, i) => (
              <span key={i} className={`intro-letter inline-block ${ch === "." ? "text-flame" : ""}`}>
                {ch}
              </span>
            ))}
          </p>
          <div style={{ visibility: "hidden" }} className="intro-hide flex flex-wrap justify-center gap-2 mt-6">
            {TAGS.map((t) => (
              <span
                key={t}
                className="intro-tag rounded-full border border-paper/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-paper/70"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div style={{ visibility: "hidden" }} className="intro-hide intro-foot px-4 sm:px-8 pb-6 sm:pb-8">
          <div className="flex items-end justify-between gap-4 mb-3">
            <div className="text-xs sm:text-sm max-w-[16rem]">
              <p ref={step} className="font-semibold text-paper">
                {STEPS[0][1]}
              </p>
              <p className="text-paper/50 mt-0.5">Warming up the 3D studio.</p>
            </div>
            <p className="font-hero font-black text-5xl sm:text-7xl leading-none tabular-nums">
              <span ref={count}>000</span>
              <span className="text-lime">%</span>
            </p>
          </div>
          <div className="h-[3px] w-full bg-paper/10 rounded-full overflow-hidden">
            <div ref={bar} className="h-full w-full bg-lime origin-left" style={{ transform: "scaleX(0)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
