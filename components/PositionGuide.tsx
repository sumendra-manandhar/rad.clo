"use client";

import { Fragment, useEffect, useRef } from "react";
import {
  GUIDE,
  PANELS,
  PRINT_LOCATIONS,
  constrainToArea,
  isSmallArea,
  overflowsArea,
  type GuideBox,
  type PrintLocation,
} from "@/lib/print-locations";
import { readableOn } from "@/lib/text-art";

/** `area` is the print-area id the design is locked inside (omitted for old orders). */
export type GuideLayer = { id: string; src: string; box: GuideBox; aspect: number; area?: string };

type Props = {
  color: string;
  /** Print areas to draw and print on (hidden areas are left out) */
  locations?: PrintLocation[];
  /** Area to highlight (e.g. the selected design's) */
  activeArea?: string | null;
  layers: GuideLayer[];
  selected?: string | null;
  onSelect?: (id: string | null) => void;
  onChange?: (id: string, box: GuideBox) => void;
  onAspect?: (id: string, aspect: number) => void;
  /** Order view: no handles, no dragging */
  readOnly?: boolean;
  /** A design shown but not yet added (e.g. text being typed): not selectable */
  preview?: GuideLayer;
};

const SNAP = 0.06; // radians — snaps rotation to 0°, 90°, 180°, 270°
const pct = (v: number, total: number) => `${(v / total) * 100}%`;

type Frame = { x: number; y: number; w: number; h: number };

/** Positions a box (guide units) inside a frame that is itself placed on the guide. */
function boxStyle(b: GuideBox, aspect: number, f: Frame): React.CSSProperties {
  return {
    left: pct(b.cx - f.x, f.w),
    top: pct(b.cy - f.y, f.h),
    width: pct(b.w, f.w),
    aspectRatio: String(aspect || 1),
    transform: `translate(-50%, -50%) rotate(${b.rotation}rad)`,
  };
}

type Drag = {
  id: string;
  layer: GuideLayer;
  mode: "move" | "scale" | "rotate";
  px: number;
  py: number;
  start: GuideBox;
  cx: number;
  cy: number;
  dist: number;
  angle: number;
  unit: number; // canvas units per screen pixel
};

/**
 * The flat garment pattern (front, back, sleeves) with the print areas drawn
 * as numbered dashed boxes. Each design stays on its area while it is
 * dragged, resized or rotated; scaled past the area, the overflow is cropped
 * off (shown faded while the design is selected). Selected designs get corner handles to
 * resize and a top handle to rotate. Keyboard: arrows nudge (Shift = bigger),
 * +/- resize, [ ] rotate; Delete is handled by the parent.
 */
export default function PositionGuide({
  color,
  locations = PRINT_LOCATIONS,
  layers,
  selected,
  onSelect,
  onChange,
  onAspect,
  readOnly,
  activeArea,
  preview,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const dark = readableOn(color) === "#ffffff"; // any colour, including admin-added ones
  const zone = dark ? "#ffd84a" : "#c99700";
  const panels = PANELS.filter((p) => locations.some((l) => l.panel === p.id));
  // Crop off the sleeve row when no sleeve areas are offered.
  const H = panels.some((p) => p.view === "left" || p.view === "right") ? GUIDE.h : 626;
  const used = new Set(layers.map((l) => l.area));

  const areaOf = (layer: GuideLayer) => (layer.area ? PRINT_LOCATIONS.find((l) => l.id === layer.area) : undefined);
  const whole: Frame = { x: 0, y: 0, w: GUIDE.w, h: H };

  // Keeps a design on its print area (or on the canvas for old orders).
  const constrain = (layer: GuideLayer, b: GuideBox) => {
    const area = areaOf(layer);
    return area ? constrainToArea(b, layer.aspect, area.rect) : clampBox(b);
  };

  const begin = (layer: GuideLayer, mode: Drag["mode"]) => (e: React.PointerEvent) => {
    if (readOnly || !rootRef.current) return;
    e.stopPropagation();
    e.preventDefault();
    onSelect?.(layer.id);
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const rect = rootRef.current.getBoundingClientRect();
    const unit = GUIDE.w / rect.width;
    const cx = rect.left + layer.box.cx / unit;
    const cy = rect.top + layer.box.cy / unit;
    drag.current = {
      id: layer.id,
      layer,
      mode,
      px: e.clientX,
      py: e.clientY,
      start: layer.box,
      cx,
      cy,
      dist: Math.hypot(e.clientX - cx, e.clientY - cy) || 1,
      angle: Math.atan2(e.clientY - cy, e.clientX - cx),
      unit,
    };
  };

  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !onChange) return;
    // Button already released (the pointer-up went elsewhere): stop dragging.
    if (e.pointerType === "mouse" && e.buttons === 0) return end();
    const s = d.start;
    if (d.mode === "move") {
      onChange(d.id, constrain(d.layer, { ...s, cx: s.cx + (e.clientX - d.px) * d.unit, cy: s.cy + (e.clientY - d.py) * d.unit }));
    } else if (d.mode === "scale") {
      onChange(d.id, constrain(d.layer, { ...s, w: (s.w * Math.hypot(e.clientX - d.cx, e.clientY - d.cy)) / d.dist }));
    } else {
      let r = s.rotation + Math.atan2(e.clientY - d.cy, e.clientX - d.cx) - d.angle;
      const quarter = Math.round(r / (Math.PI / 2)) * (Math.PI / 2);
      if (Math.abs(r - quarter) < SNAP) r = quarter;
      onChange(d.id, constrain(d.layer, { ...s, rotation: Math.atan2(Math.sin(r), Math.cos(r)) }));
    }
  };

  const end = () => {
    drag.current = null;
  };

  // Safety net: any release anywhere ends a drag.
  useEffect(() => {
    const stop = () => (drag.current = null);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, []);

  const onKey = (layer: GuideLayer) => (e: React.KeyboardEvent) => {
    if (readOnly || !onChange) return;
    const b = layer.box;
    const step = e.shiftKey ? 25 : 5;
    const map: Record<string, Partial<GuideBox>> = {
      ArrowLeft: { cx: b.cx - step },
      ArrowRight: { cx: b.cx + step },
      ArrowUp: { cy: b.cy - step },
      ArrowDown: { cy: b.cy + step },
      "+": { w: b.w * 1.05 },
      "=": { w: b.w * 1.05 },
      "-": { w: b.w / 1.05 },
      "[": { rotation: b.rotation - Math.PI / 36 },
      "]": { rotation: b.rotation + Math.PI / 36 },
    };
    if (map[e.key]) {
      e.preventDefault();
      onChange(layer.id, constrain(layer, { ...b, ...map[e.key] }));
    }
  };

  return (
    <div
      ref={rootRef}
      className={`relative w-full select-none ${readOnly ? "" : "touch-none"}`}
      style={{ aspectRatio: `${GUIDE.w} / ${H}` }}
      onPointerDown={() => !readOnly && onSelect?.(null)}
    >
      <svg viewBox={`0 0 ${GUIDE.w} ${H}`} className="absolute inset-0 w-full h-full" aria-hidden>
        {panels.map((p) => (
          <g key={p.id}>
            <path d={p.outline} fill={color} stroke={dark ? "#ffffff30" : "#00000022"} strokeWidth="4" strokeLinejoin="round" />
            {p.neck && <path d={p.neck} fill="none" stroke={dark ? "#ffffff30" : "#00000026"} strokeWidth="5" />}
            <text
              x={p.rect.x + p.rect.w / 2}
              y={p.view === "front" || p.view === "back" ? p.rect.y + p.rect.h - 22 : p.rect.y + p.rect.h - 18}
              textAnchor="middle"
              fontSize="26"
              fontWeight="800"
              letterSpacing="3"
              fill={dark ? "#ffffff30" : "#00000024"}
            >
              {p.label.toUpperCase()}
            </text>
          </g>
        ))}

        {/* Print areas: numbered dashed boxes, matching PrintAreasLegend */}
        {locations.map((loc) => {
          const n = PRINT_LOCATIONS.indexOf(loc) + 1;
          const on = activeArea === loc.id;
          const { x, y, w, h } = loc.rect;
          return (
            <g key={loc.id}>
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill={on ? `${zone}26` : used.has(loc.id) ? `${zone}12` : "none"}
                stroke={zone}
                strokeWidth={on ? 4 : 3}
                strokeDasharray="10 7"
                opacity={on || used.has(loc.id) ? 1 : 0.8}
              />
              {/* Number badge, matching the legend */}
              <circle cx={x} cy={y} r="19" fill={zone} />
              <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize="24" fontWeight="800" fill={dark ? "#111" : "#fff"}>
                {n}
              </text>
              {/* Name and size along the bottom, where designs rarely cover it */}
              {!isSmallArea(loc) && (
                <text x={x + w / 2} y={y + h - 44} textAnchor="middle" fontSize="28" fontWeight="800" fill={zone}>
                  {loc.label.toUpperCase()}
                  <tspan x={x + w / 2} dy="30" fontSize="25" fontWeight="600">
                    {loc.inches.w}″ × {loc.inches.h}″
                  </tspan>
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {layers.map((layer) => {
        const isSel = !readOnly && selected === layer.id;
        // A design whose area the admin has since hidden won't print.
        const onGarment = !layer.area || locations.some((l) => l.id === layer.area);
        const area = areaOf(layer);
        const crop = area && overflowsArea(layer.box, layer.aspect, area.rect) ? area.rect : null;
        const art = (faded?: boolean) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={layer.src}
            alt=""
            draggable={false}
            className={`w-full h-full object-contain pointer-events-none ${faded ? "opacity-30" : ""}`}
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalWidth && img.naturalHeight) onAspect?.(layer.id, img.naturalWidth / img.naturalHeight);
            }}
          />
        );
        const corners = isSel && (
          <>
            <span className="absolute inset-0 border-2 border-sky-500 pointer-events-none" />
            {["-left-1.5 -top-1.5", "-right-1.5 -top-1.5", "-left-1.5 -bottom-1.5", "-right-1.5 -bottom-1.5"].map((pos) => (
              <span
                key={pos}
                onPointerDown={begin(layer, "scale")}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={end}
                className={`absolute ${pos} w-3 h-3 bg-white border-2 border-sky-500 cursor-nwse-resize`}
              />
            ))}
            <span className="absolute left-1/2 -top-7 h-7 w-0.5 -translate-x-1/2 bg-sky-500 pointer-events-none" />
            <span
              onPointerDown={begin(layer, "rotate")}
              onPointerMove={move}
              onPointerUp={end}
              onPointerCancel={end}
              title="Drag to rotate"
              className="absolute left-1/2 -top-9 w-4 h-4 -translate-x-1/2 bg-white border-2 border-sky-500 cursor-grab"
            />
          </>
        );
        // The same elements are kept whether or not the design is cropped or
        // selected: swapping them mid-drag would drop the pointer capture and
        // leave the drag stuck. The design is drawn inside a frame — its print
        // area when it's cropped — so only the part that prints shows. When
        // selected, an unclipped box on top shows the cropped-off part faded
        // and holds the resize/rotate handles.
        return (
          <Fragment key={layer.id}>
            <div
              className={`absolute overflow-hidden pointer-events-none ${isSel ? "z-10" : ""}`}
              style={frameStyle(crop ?? whole, H)}
            >
              <div
                role={readOnly ? undefined : "button"}
                tabIndex={readOnly ? undefined : 0}
                aria-label={readOnly ? undefined : "Design — drag to move"}
                onKeyDown={onKey(layer)}
                onPointerDown={begin(layer, "move")}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={end}
                className={`absolute pointer-events-auto outline-none ${readOnly ? "" : "cursor-move"}`}
                style={{ ...boxStyle(layer.box, layer.aspect, crop ?? whole), opacity: onGarment ? 1 : 0.45 }}
              >
                {art()}
                {!onGarment && <span className="absolute inset-0 border-2 border-dashed border-red-500 pointer-events-none" />}
              </div>
            </div>
            {isSel && (
              <div
                onPointerDown={begin(layer, "move")}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={end}
                className="absolute z-10 cursor-move"
                style={boxStyle(layer.box, layer.aspect, whole)}
              >
                {crop && art(true)}
                {corners}
              </div>
            )}
          </Fragment>
        );
      })}

      {preview &&
        (() => {
          const f = areaOf(preview)?.rect ?? whole;
          return (
            <div className="absolute overflow-hidden pointer-events-none" style={frameStyle(f, H)}>
              <div className="absolute" style={boxStyle(preview.box, preview.aspect, f)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview.src} alt="" className="w-full h-full object-contain" />
              </div>
            </div>
          );
        })()}
    </div>
  );
}

function frameStyle(f: Frame, H: number): React.CSSProperties {
  return { left: pct(f.x, GUIDE.w), top: pct(f.y, H), width: pct(f.w, GUIDE.w), height: pct(f.h, H) };
}

function clampBox(b: GuideBox): GuideBox {
  return {
    ...b,
    cx: Math.min(GUIDE.w, Math.max(0, b.cx)),
    cy: Math.min(GUIDE.h, Math.max(0, b.cy)),
    w: Math.min(700, Math.max(18, b.w)),
  };
}
