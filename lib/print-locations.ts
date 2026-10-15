// Garment pieces used by the studio's Position Guide and the 3D viewer.
//
// The guide is one flat canvas (GUIDE.w × GUIDE.h units) showing the front,
// back and both sleeves laid out like a sewing pattern. Each piece has:
//   rect    — where it sits on that canvas (its aspect matches `inches`)
//   inches  — the real size that rect represents on the garment
//   top     — inches from the top of the shoulders to the top of the rect
// A design is printed on whichever piece its centre sits on, and each piece
// that has at least one design is charged once (admin → Pricing).

import type { PrintPlacement } from "@/lib/types";

export type PrintView = "front" | "back" | "left" | "right";

export type PrintLocation = {
  id: string;
  label: string;
  view: PrintView;
  defaultPrice: number;
  inches: { w: number; h: number };
  top: number;
  rect: { x: number; y: number; w: number; h: number };
  outline: string;
  neck?: string;
};

export const GUIDE = { w: 1000, h: 1010 };

export const PRINT_LOCATIONS: PrintLocation[] = [
  {
    id: "front",
    label: "Front",
    view: "front",
    defaultPrice: 199,
    inches: { w: 21, h: 27 },
    top: 0,
    rect: { x: 30, y: 30, w: 440, h: 566 },
    outline: "M30,110 L150,42 Q250,30 350,42 L470,110 L458,596 L42,596 Z",
    neck: "M185,40 Q250,120 315,40",
  },
  {
    id: "back",
    label: "Back",
    view: "back",
    defaultPrice: 199,
    inches: { w: 21, h: 27 },
    top: 0,
    rect: { x: 530, y: 30, w: 440, h: 566 },
    outline: "M530,110 L650,42 Q750,30 850,42 L970,110 L958,596 L542,596 Z",
    neck: "M685,40 Q750,62 815,40",
  },
  {
    id: "left-sleeve",
    label: "Left Sleeve",
    view: "left",
    defaultPrice: 79,
    inches: { w: 10, h: 9 },
    top: 2.5,
    rect: { x: 80, y: 660, w: 340, h: 306 },
    outline: "M110,666 Q250,640 390,666 L420,966 L80,966 Z",
  },
  {
    id: "right-sleeve",
    label: "Right Sleeve",
    view: "right",
    defaultPrice: 79,
    inches: { w: 10, h: 9 },
    top: 2.5,
    rect: { x: 580, y: 660, w: 340, h: 306 },
    outline: "M610,666 Q750,640 890,666 L920,966 L580,966 Z",
  },
];

export const DEFAULT_LOCATION = "front";

/** Store designs print 11″ wide, centred, with the top edge 5.5″ below the shoulder line. */
export const FIXED_PRINT_SPEC = { widthIn: 11, topIn: 5.5 };

/**
 * Centred placement on a piece whose artwork top edge sits `topIn` inches
 * below the shoulder line. The width shrinks if a tall design would run off
 * the bottom of the piece. `aspect` is the artwork's width ÷ height.
 */
export function placementFromTop(loc: PrintLocation, widthIn: number, aspect: number, topIn: number): PrintPlacement {
  const a = aspect > 0 ? aspect : 1;
  const room = loc.top + loc.inches.h - 1 - topIn; // keep 1″ clear of the hem
  const w = Math.max(1, Math.min(widthIn, loc.inches.w, room * a));
  const h = w / a;
  return { x: 0.5, y: (topIn - loc.top + h / 2) / loc.inches.h, w: w / loc.inches.w, rotation: 0 };
}

/**
 * The fixed spot for store designs given which print areas are enabled:
 * the front, or the same spot on the back if the front is hidden.
 */
export function fixedPrintFor(visibleIds: string[], aspect = 1): { location: string; placement: PrintPlacement } {
  const id = visibleIds.includes("front") || !visibleIds.length ? "front" : visibleIds.includes("back") ? "back" : visibleIds[0];
  const loc = getLocation(id)!;
  if (loc.view === "front" || loc.view === "back") {
    return { location: id, placement: placementFromTop(loc, FIXED_PRINT_SPEC.widthIn, aspect, FIXED_PRINT_SPEC.topIn) };
  }
  return { location: id, placement: { x: 0.5, y: 0.35, w: 0.45, rotation: 0 } };
}

/** Fixed spot on the front for a square design. */
export const FIXED_PRINT = fixedPrintFor(["front"]);

export function getLocation(id: string) {
  return PRINT_LOCATIONS.find((l) => l.id === id);
}

/** A design on the guide canvas: centre, width (canvas units), rotation (rad, clockwise). */
export type GuideBox = { cx: number; cy: number; w: number; rotation: number };

/** The piece under a canvas point, if any (only among `locations`). */
export function pieceAt(cx: number, cy: number, locations: PrintLocation[] = PRINT_LOCATIONS) {
  return locations.find(
    (l) => cx >= l.rect.x && cx <= l.rect.x + l.rect.w && cy >= l.rect.y && cy <= l.rect.y + l.rect.h
  );
}

/** Canvas box → placement relative to a piece (x/y 0–1 across/down, w as a fraction of its width). */
export function toPlacement(loc: PrintLocation, b: GuideBox): PrintPlacement {
  return {
    x: (b.cx - loc.rect.x) / loc.rect.w,
    y: (b.cy - loc.rect.y) / loc.rect.h,
    w: b.w / loc.rect.w,
    rotation: b.rotation,
  };
}

/** Placement relative to a piece → canvas box. */
export function toGuideBox(loc: PrintLocation, p: PrintPlacement): GuideBox {
  return {
    cx: loc.rect.x + p.x * loc.rect.w,
    cy: loc.rect.y + p.y * loc.rect.h,
    w: p.w * loc.rect.w,
    rotation: p.rotation,
  };
}

/** Sanitises a placement from the browser (used by the order API). */
export function cleanPlacement(p: Partial<PrintPlacement> | undefined): PrintPlacement {
  const num = (v: unknown, d: number, min: number, max: number) =>
    typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : d;
  const r = num(p?.rotation, 0, -100, 100);
  return {
    x: num(p?.x, 0.5, 0, 1),
    y: num(p?.y, 0.5, 0, 1),
    w: num(p?.w, 0.5, 0.01, 2),
    rotation: Math.atan2(Math.sin(r), Math.cos(r)),
  };
}

/** Human-readable measurements for the printer. */
export function describePlacement(loc: PrintLocation, p: PrintPlacement, aspect: number) {
  const width = p.w * loc.inches.w;
  const height = width / (aspect || 1);
  const fromCentre = (p.x - 0.5) * loc.inches.w;
  const topEdge = loc.top + p.y * loc.inches.h - height / 2;
  const side = loc.view === "front" || loc.view === "back";
  const deg = Math.round((p.rotation * 180) / Math.PI);
  const across =
    Math.abs(fromCentre) < 0.25
      ? "centred"
      : `${Math.abs(fromCentre).toFixed(1)}″ ${fromCentre > 0 ? "right" : "left"} of centre (as you look at it)`;
  return [
    `${width.toFixed(1)}″ × ${height.toFixed(1)}″`,
    across,
    `top edge ${topEdge.toFixed(1)}″ below ${side ? "the shoulder line" : "the shoulder seam"}`,
    deg ? `rotated ${deg}°` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}
