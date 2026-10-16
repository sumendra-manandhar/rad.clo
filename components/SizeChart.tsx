"use client";

import { useEffect, useState } from "react";
import { Ruler, X } from "lucide-react";
import type { Garment } from "@/lib/garments";
import { MODEL_PHOTOS, SIZE_CHART } from "@/lib/size-chart";

/** Size table in cm with a garment switcher and model photos. */
export function SizeChart({ garments, initial }: { garments: Garment[]; initial?: string }) {
  const withChart = garments.filter((g) => SIZE_CHART[g.slug]);
  const [slug, setSlug] = useState(withChart.some((g) => g.slug === initial) ? initial! : withChart[0]?.slug);
  const rows = slug ? SIZE_CHART[slug] : undefined;
  const photos = MODEL_PHOTOS.filter((p) => p.garment === slug);
  if (!rows) return null;

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {withChart.map((g) => (
          <button
            key={g.slug}
            onClick={() => setSlug(g.slug)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              slug === g.slug ? "bg-ink text-paper border-ink" : "bg-white border-line hover:border-ink/40"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-sm text-center tabular-nums">
          <thead className="bg-paper text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="py-3 px-3 text-left">Size</th>
              <th className="py-3 px-3">Chest width</th>
              <th className="py-3 px-3">Length</th>
              <th className="py-3 px-3">Sleeve</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.size}>
                <td className="py-3 px-3 text-left font-bold">{r.size}</td>
                <td className="py-3 px-3">{r.chest} cm</td>
                <td className="py-3 px-3">{r.length} cm</td>
                <td className="py-3 px-3">{r.sleeve} cm</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted mt-3">
        Measured flat, ±2 cm. Chest width is armpit to armpit — double it for the full chest. Length is from the
        highest point of the shoulder to the hem. Between sizes? Take the bigger one for a relaxed fit.
      </p>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
          {photos.map((p) => (
            <figure key={p.src} className="rounded-2xl overflow-hidden bg-paper">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.src} alt={p.caption} className="w-full aspect-[3/4] object-cover" loading="lazy" />
              <figcaption className="text-xs p-2.5">{p.caption}</figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}

/** "Size chart" link that opens the chart in a dialog. */
export function SizeChartButton({ garments, garment }: { garments: Garment[]; garment: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs font-semibold underline">
        <Ruler className="w-3.5 h-3.5" /> Size chart (cm)
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/50 p-0 sm:p-4" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Size chart"
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-paper text-ink p-5 sm:p-7"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl font-bold">Size chart</h2>
              <button onClick={() => setOpen(false)} aria-label="Close" className="w-9 h-9 rounded-full bg-white border border-line flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* key resets the garment tab to the one being viewed */}
            <SizeChart key={garment} garments={garments} initial={garment} />
          </div>
        </div>
      )}
    </>
  );
}
