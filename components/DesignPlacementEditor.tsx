"use client";

import { useRef, useCallback } from "react";
import { Move } from "lucide-react";

export type Placement = {
  offsetX: number; // -1..1-ish, relative to print area half-width
  offsetY: number; // -1..1-ish, relative to print area half-height
  scale: number; // multiplier, 1 = default size
  rotation: number; // radians
};

const VB_W = 400;
const VB_H = 500;

const TEE_OUTER =
  "M80,72 L148,16 Q200,-6 252,16 L320,72 L382,132 L344,172 L308,136 L308,472 L92,472 L92,136 L56,172 L18,132 Z";
const TEE_NECK = "M164,18 Q200,54 236,18 Q200,4 164,18 Z";
const HOODIE_OUTER =
  "M80,90 L128,30 Q140,10 160,20 L160,44 Q160,66 200,66 Q240,66 240,44 L240,20 Q260,10 272,30 L320,90 L382,148 L344,186 L308,150 L308,478 L92,478 L92,150 L56,186 L18,148 Z";
const HOODIE_HOOD = "M148,36 Q200,10 252,36 Q252,66 200,72 Q148,66 148,36 Z";
const HOODIE_POCKET =
  "M140,340 Q140,326 154,326 L246,326 Q260,326 260,340 L260,400 Q200,416 140,400 Z";
const POLO_COLLAR_L = "M164,18 L138,54 L172,58 Z";
const POLO_COLLAR_R = "M236,18 L262,54 L228,58 Z";

function getShape(category: string) {
  if (category === "hoodies") {
    return {
      outer: HOODIE_OUTER,
      extra: [HOODIE_HOOD, HOODIE_POCKET],
      neckHole: null as string | null,
    };
  }
  if (category === "polo") {
    return { outer: TEE_OUTER, extra: [POLO_COLLAR_L, POLO_COLLAR_R], neckHole: TEE_NECK };
  }
  return { outer: TEE_OUTER, extra: [], neckHole: TEE_NECK };
}

function shadeColor(hex: string, amt: number) {
  try {
    const c = hex.replace("#", "");
    const num = parseInt(
      c.length === 3 ? c.split("").map((ch) => ch + ch).join("") : c,
      16
    );
    let r = (num >> 16) + amt;
    let g = ((num >> 8) & 0x00ff) + amt;
    let b = (num & 0x0000ff) + amt;
    r = Math.max(Math.min(255, r), 0);
    g = Math.max(Math.min(255, g), 0);
    b = Math.max(Math.min(255, b), 0);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  } catch {
    return hex;
  }
}

// Where the printable area sits for each side, in the 400x500 viewBox.
export const PRINT_AREA = {
  front: { cx: 200, cy: 250, w: 120, h: 150 },
  back: { cx: 200, cy: 210, w: 140, h: 170 },
} as const;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

type Side = "front" | "back";

type DragState = {
  startPoint: { x: number; y: number };
  startOffsetX: number;
  startOffsetY: number;
};

export default function DesignPlacementEditor({
  color,
  category,
  side,
  decalSrc,
  active,
  interactive,
  placement,
  onPlacementChange,
  onSelectSide,
}: {
  color: string;
  category: string;
  side: Side;
  decalSrc: string | null;
  /** Does the current design belong to this side? */
  active: boolean;
  /** Show drag handles on this instance? (usually only the active side) */
  interactive: boolean;
  placement: Placement;
  onPlacementChange?: (patch: Partial<Placement>) => void;
  onSelectSide?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<DragState | null>(null);

  const shape = getShape(category);
  const printArea = PRINT_AREA[side];
  const shadow = shadeColor(color, color === "#ffffff" ? -18 : -30);

  const getViewboxPoint = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * VB_W,
      y: ((clientY - rect.top) / rect.height) * VB_H,
    };
  }, []);

  const startDrag = (e: React.PointerEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const start = getViewboxPoint(e.clientX, e.clientY);
    dragState.current = {
      startPoint: start,
      startOffsetX: placement.offsetX,
      startOffsetY: placement.offsetY,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const ds = dragState.current;
    if (!ds) return;
    const pt = getViewboxPoint(e.clientX, e.clientY);
    const dx = pt.x - ds.startPoint.x;
    const dy = pt.y - ds.startPoint.y;
    onPlacementChange?.({
      offsetX: clamp(ds.startOffsetX + dx / (printArea.w * 0.5), -0.8, 0.8),
      offsetY: clamp(ds.startOffsetY + dy / (printArea.h * 0.5), -0.8, 0.8),
    });
  };

  const endDrag = () => {
    dragState.current = null;
  };

  const showDesign = active && !!decalSrc;

  // Box geometry, expressed as percentages so it scales correctly with the
  // container regardless of its rendered pixel size (container is aspect
  // locked to 400:500, matching the SVG viewBox, so % of width and % of
  // height both represent the same physical scale on screen).
  const centerXPct = ((printArea.cx + placement.offsetX * printArea.w * 0.5) / VB_W) * 100;
  const centerYPct = ((printArea.cy + placement.offsetY * printArea.h * 0.5) / VB_H) * 100;
  const boxSize = printArea.w * 0.85 * placement.scale;
  const boxWPct = (boxSize / VB_W) * 100;
  const boxHPct = (boxSize / VB_H) * 100;
  const rotationDeg = (placement.rotation * 180) / Math.PI;

  return (
    <div
      onClick={!active ? onSelectSide : undefined}
      className={!active ? "cursor-pointer" : undefined}
    >
      <div
        ref={containerRef}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{ aspectRatio: `${VB_W} / ${VB_H}` }}
        className="relative w-full select-none touch-none"
      >
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="absolute inset-0 w-full h-full pointer-events-none">
          <path d={shape.outer} fill={color} stroke={shadow} strokeWidth={2} fillRule="evenodd" />
          {side === "front" && shape.neckHole && (
            <path d={shape.neckHole} fill="#e7e3de" opacity={0.9} />
          )}
          {shape.extra.map((d, i) => (
            <path key={i} d={d} fill={shadeColor(color, -22)} opacity={0.9} stroke={shadow} strokeWidth={1} />
          ))}
          {/* dashed print-area guide */}
          <rect
            x={printArea.cx - printArea.w / 2}
            y={printArea.cy - printArea.h / 2}
            width={printArea.w}
            height={printArea.h}
            fill="none"
            stroke="#9ca3af"
            strokeDasharray="3 4"
            strokeWidth={1}
            opacity={0.4}
          />
        </svg>

        {showDesign && (
          <div
            style={{
              position: "absolute",
              left: `${centerXPct}%`,
              top: `${centerYPct}%`,
              width: `${boxWPct}%`,
              height: `${boxHPct}%`,
              transform: `translate(-50%, -50%) rotate(${rotationDeg}deg)`,
            }}
          >
            {/* Drag-to-move surface */}
            <div
              onPointerDown={startDrag}
              className={`absolute inset-0 ${interactive ? "cursor-move" : ""}`}
              style={
                interactive
                  ? { outline: "2px dashed #171717", outlineOffset: "4px" }
                  : undefined
              }
            >
              <img
                src={decalSrc || undefined}
                alt="Design"
                draggable={false}
                className="w-full h-full object-contain pointer-events-none"
              />
            </div>

            {interactive && (
              <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center shadow">
                <Move className="w-3 h-3" />
              </div>
            )}
          </div>
        )}

        {!active && (
          <span className="absolute inset-0 flex items-end justify-center pb-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
            Tap to place design here
          </span>
        )}
      </div>
    </div>
  );
}
