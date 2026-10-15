"use client";

import { useRef } from "react";
import { GUIDE, PRINT_LOCATIONS, pieceAt, type GuideBox, type PrintLocation } from "@/lib/print-locations";

export type GuideLayer = { id: string; src: string; box: GuideBox; aspect: number };

type Props = {
  color: string;
  /** Pieces to draw and print on (hidden print areas are left out) */
  locations?: PrintLocation[];
  layers: GuideLayer[];
  selected?: string | null;
  onSelect?: (id: string | null) => void;
  onChange?: (id: string, box: GuideBox) => void;
  onAspect?: (id: string, aspect: number) => void;
  /** Order view: no handles, no dragging */
  readOnly?: boolean;
};

const DARK = ["#1f1f1f", "#1E334D", "#662735", "#476748", "#6F7573"];
const SNAP = 0.06; // radians — snaps rotation to 0°, 90°, 180°, 270°
const pct = (v: number, total: number) => `${(v / total) * 100}%`;

type Drag = {
  id: string;
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
 * The flat garment pattern (front, back, sleeves). Designs can be dragged
 * anywhere; each prints on the piece under its centre. Selected designs get
 * corner handles to resize and a top handle to rotate. Keyboard: arrows
 * nudge (Shift = bigger), +/- resize, [ ] rotate, Delete is handled by the
 * parent via onSelect/onChange.
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
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const dark = DARK.includes(color);

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
    const s = d.start;
    if (d.mode === "move") {
      onChange(d.id, clampBox({ ...s, cx: s.cx + (e.clientX - d.px) * d.unit, cy: s.cy + (e.clientY - d.py) * d.unit }));
    } else if (d.mode === "scale") {
      onChange(d.id, clampBox({ ...s, w: (s.w * Math.hypot(e.clientX - d.cx, e.clientY - d.cy)) / d.dist }));
    } else {
      let r = s.rotation + Math.atan2(e.clientY - d.cy, e.clientX - d.cx) - d.angle;
      const quarter = Math.round(r / (Math.PI / 2)) * (Math.PI / 2);
      if (Math.abs(r - quarter) < SNAP) r = quarter;
      onChange(d.id, { ...s, rotation: Math.atan2(Math.sin(r), Math.cos(r)) });
    }
  };

  const end = () => (drag.current = null);

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
      onChange(layer.id, clampBox({ ...b, ...map[e.key] }));
    }
  };

  return (
    <div
      ref={rootRef}
      className={`relative w-full select-none ${readOnly ? "" : "touch-none"}`}
      style={{ aspectRatio: `${GUIDE.w} / ${GUIDE.h}` }}
      onPointerDown={() => !readOnly && onSelect?.(null)}
    >
      <svg viewBox={`0 0 ${GUIDE.w} ${GUIDE.h}`} className="absolute inset-0 w-full h-full" aria-hidden>
        {locations.map((loc) => (
          <g key={loc.id}>
            <path d={loc.outline} fill={color} stroke={dark ? "#ffffff30" : "#00000022"} strokeWidth="4" strokeLinejoin="round" />
            {loc.neck && <path d={loc.neck} fill="none" stroke={dark ? "#ffffff30" : "#00000026"} strokeWidth="5" />}
            <text
              x={loc.rect.x + loc.rect.w / 2}
              y={loc.rect.y + loc.rect.h / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={loc.view === "front" || loc.view === "back" ? 44 : 32}
              fontWeight="800"
              letterSpacing="2"
              fill={dark ? "#ffffff22" : "#00000018"}
            >
              {loc.label.toUpperCase()}
            </text>
          </g>
        ))}
      </svg>

      {layers.map((layer) => {
        const isSel = !readOnly && selected === layer.id;
        const onGarment = !!pieceAt(layer.box.cx, layer.box.cy, locations);
        return (
          <div
            key={layer.id}
            role={readOnly ? undefined : "button"}
            tabIndex={readOnly ? undefined : 0}
            aria-label={readOnly ? undefined : "Design — drag to move"}
            onKeyDown={onKey(layer)}
            onPointerDown={begin(layer, "move")}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
            className={`absolute outline-none ${readOnly ? "" : "cursor-move"} ${isSel ? "z-10" : ""}`}
            style={{
              left: pct(layer.box.cx, GUIDE.w),
              top: pct(layer.box.cy, GUIDE.h),
              width: pct(layer.box.w, GUIDE.w),
              aspectRatio: String(layer.aspect || 1),
              transform: `translate(-50%, -50%) rotate(${layer.box.rotation}rad)`,
              opacity: onGarment ? 1 : 0.45,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={layer.src}
              alt=""
              draggable={false}
              className="w-full h-full object-contain pointer-events-none"
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalWidth && img.naturalHeight) onAspect?.(layer.id, img.naturalWidth / img.naturalHeight);
              }}
            />
            {!onGarment && <span className="absolute inset-0 border-2 border-dashed border-red-500 pointer-events-none" />}
            {isSel && (
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
            )}
          </div>
        );
      })}
    </div>
  );
}

function clampBox(b: GuideBox): GuideBox {
  return {
    ...b,
    cx: Math.min(GUIDE.w, Math.max(0, b.cx)),
    cy: Math.min(GUIDE.h, Math.max(0, b.cy)),
    w: Math.min(700, Math.max(18, b.w)),
  };
}
