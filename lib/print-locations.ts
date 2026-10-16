// Garment pieces and print areas used by the studio's Position Guide, the 3D
// viewer and the order view.
//
// The guide is one flat canvas (GUIDE.w × GUIDE.h units) showing the front,
// back and both sleeves laid out like a sewing pattern (PANELS). On those
// panels sit the print areas (PRINT_LOCATIONS), each a fixed-size box from
// the standard print-size chart — full front, left chest, full back, upper
// back and the sleeves. A design belongs to one area and always stays inside
// its box. Each area that has at least one design is charged once
// (admin → Garments).
//
// Every area and panel has:
//   inches  — its real size on the garment
//   top     — inches from the top of the shoulders (sleeves: the shoulder
//             seam) to the top of the box
//   cx      — inches from the panel's centre line to the box's centre, as you
//             look at that side (+ = to the right)
//   rect    — where the box sits on the guide canvas

import type { PrintPlacement, PrintSpec } from "@/lib/types";

export type PrintView = "front" | "back" | "left" | "right";

type Rect = { x: number; y: number; w: number; h: number };

export type GarmentPanel = {
  id: string;
  label: string;
  view: PrintView;
  inches: { w: number; h: number };
  top: number;
  cx: number;
  rect: Rect;
  outline: string;
  neck?: string;
};

export type PrintLocation = {
  id: string;
  label: string;
  /** One-line hint for buyers */
  hint: string;
  view: PrintView;
  panel: string;
  defaultPrice: number;
  inches: { w: number; h: number };
  top: number;
  cx: number;
  rect: Rect;
};

export const GUIDE = { w: 1000, h: 1010 };

export const PANELS: GarmentPanel[] = [
  {
    id: "front",
    label: "Front",
    view: "front",
    inches: { w: 21, h: 27 },
    top: 0,
    cx: 0,
    rect: { x: 30, y: 30, w: 440, h: 566 },
    outline: "M30,110 L150,42 Q250,30 350,42 L470,110 L458,596 L42,596 Z",
    neck: "M185,40 Q250,120 315,40",
  },
  {
    id: "back",
    label: "Back",
    view: "back",
    inches: { w: 21, h: 27 },
    top: 0,
    cx: 0,
    rect: { x: 530, y: 30, w: 440, h: 566 },
    outline: "M530,110 L650,42 Q750,30 850,42 L970,110 L958,596 L542,596 Z",
    neck: "M685,40 Q750,62 815,40",
  },
  {
    id: "left-sleeve",
    label: "Left sleeve",
    view: "left",
    inches: { w: 10, h: 9 },
    top: 2.5,
    cx: 0,
    rect: { x: 80, y: 660, w: 340, h: 306 },
    outline: "M110,666 Q250,640 390,666 L420,966 L80,966 Z",
  },
  {
    id: "right-sleeve",
    label: "Right sleeve",
    view: "right",
    inches: { w: 10, h: 9 },
    top: 2.5,
    cx: 0,
    rect: { x: 580, y: 660, w: 340, h: 306 },
    outline: "M610,666 Q750,640 890,666 L920,966 L580,966 Z",
  },
];

const panel = (id: string) => PANELS.find((p) => p.id === id)!;

/** Canvas rect of a box `w`×`h` inches on a panel, `top` below the shoulder and `cx` off centre. */
function rectOn(p: GarmentPanel, w: number, h: number, top: number, cx: number): Rect {
  const s = p.rect.w / p.inches.w; // canvas units per inch
  return {
    x: p.rect.x + (p.inches.w / 2 + cx - w / 2) * s,
    y: p.rect.y + (top - p.top) * s,
    w: w * s,
    h: h * s,
  };
}

type AreaSpec = Omit<PrintLocation, "rect" | "view">;

// Ids "front" / "back" / sleeves are kept from the first version of the site,
// so saved prices, hidden areas and old orders still match.
const AREAS: AreaSpec[] = [
  {
    id: "front",
    label: "Full front",
    hint: "Main graphic · top edge about 2–3″ below the collar",
    panel: "front",
    defaultPrice: 199,
    inches: { w: 11, h: 17 },
    top: 5.5,
    cx: 0,
  },
  {
    id: "left-chest",
    label: "Left chest",
    hint: "Small logo over the heart",
    panel: "front",
    defaultPrice: 99,
    inches: { w: 3.5, h: 3.5 },
    top: 6.5,
    // The wearer's left is on the right as you look at the front.
    cx: 4,
  },
  {
    id: "upper-back",
    label: "Upper back",
    hint: "Logo or text just below the collar",
    panel: "back",
    defaultPrice: 99,
    inches: { w: 4, h: 3 },
    top: 2,
    cx: 0,
  },
  {
    id: "back",
    label: "Full back",
    hint: "Big back print · names & numbers",
    panel: "back",
    defaultPrice: 199,
    inches: { w: 11, h: 17 },
    top: 5.5,
    cx: 0,
  },
  {
    id: "left-sleeve",
    label: "Left sleeve",
    hint: "Small icon or flag",
    panel: "left-sleeve",
    defaultPrice: 79,
    inches: { w: 2.5, h: 2.5 },
    top: 4.5,
    cx: 0,
  },
  {
    id: "right-sleeve",
    label: "Right sleeve",
    hint: "Small icon or flag",
    panel: "right-sleeve",
    defaultPrice: 79,
    inches: { w: 2.5, h: 2.5 },
    top: 4.5,
    cx: 0,
  },
];

export const PRINT_LOCATIONS: PrintLocation[] = AREAS.map((a) => {
  const p = panel(a.panel);
  return { ...a, view: p.view, rect: rectOn(p, a.inches.w, a.inches.h, a.top, a.cx) };
});

export const DEFAULT_LOCATION = "front";

/** Store designs print 11″ wide, centred, with the top edge 5.5″ below the shoulder line. */
export const FIXED_PRINT_SPEC = { widthIn: 11, topIn: 5.5 };

/** A small area (chest, upper back, sleeves) rather than a full front/back */
export const isSmallArea = (loc: PrintLocation) => loc.inches.w < 6;

/**
 * Centred placement on an area whose artwork top edge sits `topIn` inches
 * below the shoulder line. The width shrinks if a tall design would run past
 * the bottom of the area. `aspect` is the artwork's width ÷ height.
 */
export function placementFromTop(loc: PrintLocation, widthIn: number, aspect: number, topIn: number): PrintPlacement {
  const a = aspect > 0 ? aspect : 1;
  const top = Math.max(loc.top, topIn);
  const room = loc.top + loc.inches.h - top;
  const w = Math.max(0.5, Math.min(widthIn, loc.inches.w, room * a));
  const h = w / a;
  return { x: 0.5, y: (top - loc.top + h / 2) / loc.inches.h, w: w / loc.inches.w, rotation: 0 };
}

/** The largest centred placement that fits inside the area. */
export function fillArea(loc: PrintLocation, aspect: number): PrintPlacement {
  const a = aspect > 0 ? aspect : 1;
  const w = Math.min(loc.inches.w, loc.inches.h * a);
  return { x: 0.5, y: 0.5, w: w / loc.inches.w, rotation: 0 };
}

/** Where a newly added design goes: full front/back at the top, small areas filled and centred. */
export function newPlacement(loc: PrintLocation, aspect: number): PrintPlacement {
  return isSmallArea(loc) ? fillArea(loc, aspect) : placementFromTop(loc, loc.inches.w, aspect, loc.top);
}

/**
 * The fixed spot for store designs given which print areas are enabled:
 * the full front, or the same spot on the full back if the front is hidden.
 */
export function fixedPrintFor(visibleIds: string[], aspect = 1): { location: string; placement: PrintPlacement } {
  const id = visibleIds.includes("front") || !visibleIds.length ? "front" : visibleIds.includes("back") ? "back" : visibleIds[0];
  const loc = getLocation(id)!;
  if (!isSmallArea(loc)) {
    return { location: id, placement: placementFromTop(loc, FIXED_PRINT_SPEC.widthIn, aspect, FIXED_PRINT_SPEC.topIn) };
  }
  return { location: id, placement: fillArea(loc, aspect) };
}

/** Fixed spot on the front for a square design. */
export const FIXED_PRINT = fixedPrintFor(["front"]);

export function getLocation(id: string) {
  return PRINT_LOCATIONS.find((l) => l.id === id);
}

/** The main area for each side of the shirt (where new designs are added). */
export const AREA_FOR_VIEW: Record<PrintView, string> = {
  front: "front",
  back: "back",
  left: "left-sleeve",
  right: "right-sleeve",
};

/**
 * The box a print's placement is relative to. Orders from before the print
 * areas existed (no `v`) were placed relative to the whole garment piece.
 */
export function placementFrame(print: Pick<PrintSpec, "location" | "v">): PrintLocation | undefined {
  const loc = getLocation(print.location);
  if (!loc || print.v === 2) return loc;
  const legacy = PANELS.find((p) => p.id === print.location);
  return legacy ? { ...loc, inches: legacy.inches, top: legacy.top, cx: legacy.cx, rect: legacy.rect } : loc;
}

/** A design on the guide canvas: centre, width (canvas units), rotation (rad, clockwise). */
export type GuideBox = { cx: number; cy: number; w: number; rotation: number };

/** Canvas box → placement relative to an area (x/y 0–1 across/down, w as a fraction of its width). */
export function toPlacement(loc: PrintLocation, b: GuideBox): PrintPlacement {
  return {
    x: (b.cx - loc.rect.x) / loc.rect.w,
    y: (b.cy - loc.rect.y) / loc.rect.h,
    w: b.w / loc.rect.w,
    rotation: b.rotation,
  };
}

/** Placement relative to an area → canvas box. */
export function toGuideBox(loc: PrintLocation, p: PrintPlacement): GuideBox {
  return {
    cx: loc.rect.x + p.x * loc.rect.w,
    cy: loc.rect.y + p.y * loc.rect.h,
    w: p.w * loc.rect.w,
    rotation: p.rotation,
  };
}

/**
 * Keeps a design (rotated or not) completely inside a rect: shrinks it if
 * it's too big, then slides it back in if it pokes out.
 */
export function fitInside(b: GuideBox, aspect: number, r: Rect): GuideBox {
  const a = aspect > 0 ? aspect : 1;
  const c = Math.abs(Math.cos(b.rotation));
  const s = Math.abs(Math.sin(b.rotation));
  // Rotated bounding box of a w × w/a design is w·(c + s/a) wide and w·(s + c/a) tall.
  const maxW = Math.min(r.w / (c + s / a), r.h / (s + c / a));
  const w = Math.max(Math.min(8, maxW), Math.min(b.w, maxW));
  const hx = (w * (c + s / a)) / 2;
  const hy = (w * (s + c / a)) / 2;
  const clamp = (v: number, lo: number, hi: number) => (lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v)));
  return {
    ...b,
    w,
    cx: clamp(b.cx, r.x + hx, r.x + r.w - hx),
    cy: clamp(b.cy, r.y + hy, r.y + r.h - hy),
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
  const fromCentre = loc.cx + (p.x - 0.5) * loc.inches.w;
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

/** "11″ × 17″" */
export const areaSize = (loc: PrintLocation) => `${loc.inches.w}″ × ${loc.inches.h}″`;
