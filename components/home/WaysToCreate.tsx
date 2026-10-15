"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Images, Upload, Type } from "lucide-react";

const WAYS = [
  {
    n: "01",
    title: "Pick a print",
    text: "Original designs from our store, sorted by category. Printed on the front chest — or move it anywhere.",
    href: "/shop",
    cta: "Browse designs",
    Icon: Images,
    tone: "bg-white text-ink",
  },
  {
    n: "02",
    title: "Upload your art",
    text: "Logos, photos, illustrations. Drag, resize and rotate it across the front, back and sleeves.",
    href: "/customize?mode=upload",
    cta: "Upload artwork",
    Icon: Upload,
    tone: "bg-ink text-white",
  },
  {
    n: "03",
    title: "Type it out",
    text: "Names, numbers, slogans. Pick a bold font and colour and see it on the shirt instantly.",
    href: "/customize?mode=text",
    cta: "Add your text",
    Icon: Type,
    tone: "bg-lime text-ink",
  },
];

/** Three cards in a row; the hovered (or tapped) one expands. */
export default function WaysToCreate() {
  const [open, setOpen] = useState(1);
  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:h-[420px]">
      {WAYS.map((w, i) => {
        const on = open === i;
        return (
          <div
            key={w.n}
            onMouseEnter={() => setOpen(i)}
            onClick={() => setOpen(i)}
            className={`relative rounded-[32px] p-7 overflow-hidden ring-1 ring-black/5 transition-[flex-grow] duration-500 ease-out cursor-pointer flex flex-col ${w.tone} ${
              on ? "lg:grow-[2.4]" : "lg:grow"
            } lg:basis-0 min-h-[220px]`}
          >
            <div className="flex items-start justify-between">
              <span className="font-black text-6xl tracking-[-0.06em] opacity-20 leading-none">{w.n}</span>
              <span className={`w-12 h-12 rounded-full flex items-center justify-center ${w.tone.includes("bg-ink") ? "bg-white/10" : "bg-ink/5"}`}>
                <w.Icon className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-auto pt-10">
              <h3 className="font-black uppercase tracking-[-0.04em] text-[clamp(26px,2.6vw,40px)] leading-[0.95]">{w.title}</h3>
              <div className={`grid transition-all duration-500 ${on ? "grid-rows-[1fr] opacity-100 mt-3" : "lg:grid-rows-[0fr] lg:opacity-0"}`}>
                <div className="overflow-hidden">
                  <p className="text-sm opacity-70 max-w-sm leading-relaxed">{w.text}</p>
                  <Link
                    href={w.href}
                    className={`inline-flex items-center gap-2 mt-5 rounded-full px-5 py-3 text-xs font-bold transition-colors ${
                      w.tone.includes("bg-ink") ? "bg-lime text-ink hover:bg-white" : "bg-ink text-white hover:bg-flame"
                    }`}
                  >
                    {w.cta.toUpperCase()} <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
