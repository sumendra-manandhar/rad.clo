import { Check } from "lucide-react";
import { GUIDE, PANELS, PRINT_LOCATIONS, areaSize, type PrintLocation } from "@/lib/print-locations";
import { formatPrice } from "@/lib/garments";

const areaNumber = (l: PrintLocation) => PRINT_LOCATIONS.indexOf(l) + 1;

/**
 * Numbered list of print areas with their sizes and prices — the key to the
 * numbered boxes on the position guide, and a size reference for buyers.
 * With `onToggle`, each row is a button that picks the area.
 */
export function PrintAreasLegend({
  locations,
  prices,
  used = [],
  dark,
  onToggle,
  columns = 2,
}: {
  locations: PrintLocation[];
  prices: Record<string, number>;
  used?: string[];
  dark?: boolean;
  onToggle?: (id: string) => void;
  columns?: 1 | 2;
}) {
  return (
    <ol className={`grid gap-2 text-xs ${columns === 2 ? "sm:grid-cols-2" : ""}`}>
      {locations.map((l) => {
        const on = used.includes(l.id);
        const body = (
          <>
            <span
              className={`w-5 h-5 shrink-0 rounded-full text-[11px] font-black flex items-center justify-center ${
                on && onToggle ? "bg-ink text-lime" : "bg-[#c99700] text-white"
              }`}
            >
              {on && onToggle ? <Check className="w-3 h-3" strokeWidth={3.5} /> : areaNumber(l)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex justify-between gap-2">
                <span className="font-semibold">{l.label}</span>
                <span className="opacity-70 shrink-0">+{formatPrice(prices[l.id] ?? 0)}</span>
              </span>
              <span className="block font-semibold opacity-80">{areaSize(l)}</span>
              <span className="block opacity-60 leading-snug">{l.hint}</span>
            </span>
          </>
        );
        const cls = `w-full flex gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors ${
          on ? "bg-lime text-ink" : dark ? "bg-white/5" : "bg-paper"
        }`;
        return (
          <li key={l.id}>
            {onToggle ? (
              <button type="button" onClick={() => onToggle(l.id)} aria-pressed={on} className={`${cls} ${on ? "" : "hover:bg-line/60"}`}>
                {body}
              </button>
            ) : (
              <div className={cls}>{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The flat shirt pattern with tappable print areas — the same drawing as the
 * studio's position guide. Selected areas turn lime with a tick.
 */
export function PrintAreaPicker({
  locations,
  selected,
  onToggle,
  prices,
}: {
  locations: PrintLocation[];
  selected: string[];
  onToggle: (id: string) => void;
  prices: Record<string, number>;
}) {
  const panels = PANELS.filter((p) => locations.some((l) => l.panel === p.id));
  const H = panels.some((p) => p.view === "left" || p.view === "right") ? GUIDE.h : 626;
  return (
    <svg viewBox={`0 0 ${GUIDE.w} ${H}`} className="w-full select-none" role="group" aria-label="Print areas">
      {panels.map((p) => (
        <g key={p.id}>
          <path d={p.outline} fill="#ffffff" stroke="#11111122" strokeWidth="4" strokeLinejoin="round" />
          {p.neck && <path d={p.neck} fill="none" stroke="#11111126" strokeWidth="5" />}
          <text
            x={p.rect.x + p.rect.w / 2}
            y={p.rect.y + p.rect.h - 20}
            textAnchor="middle"
            fontSize="26"
            fontWeight="800"
            letterSpacing="3"
            fill="#11111130"
          >
            {p.label.toUpperCase()}
          </text>
        </g>
      ))}
      {locations.map((loc) => {
        const on = selected.includes(loc.id);
        const { x, y, w, h } = loc.rect;
        const small = w < 120;
        const toggle = () => onToggle(loc.id);
        return (
          <g
            key={loc.id}
            onClick={toggle}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), toggle())}
            role="checkbox"
            aria-checked={on}
            aria-label={`${loc.label} ${areaSize(loc)}, ${formatPrice(prices[loc.id] ?? 0)}`}
            tabIndex={0}
            className="cursor-pointer outline-none group"
          >
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx="8"
              fill={on ? "#d4ff3a" : "#c9970010"}
              stroke={on ? "#111111" : "#c99700"}
              strokeWidth={on ? 5 : 3.5}
              strokeDasharray={on ? "0" : "12 8"}
              className="transition-all group-hover:fill-[#c9970026] group-focus-visible:stroke-[#2f6bff]"
            />
            <circle cx={x} cy={y} r="19" fill={on ? "#111111" : "#c99700"} />
            <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize="24" fontWeight="800" fill={on ? "#d4ff3a" : "#fff"} className="pointer-events-none">
              {areaNumber(loc)}
            </text>
            <text
              x={x + w / 2}
              y={y + h / 2 + (small ? 2 : -10)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={small ? 40 : 64}
              fontWeight="900"
              fill={on ? "#111" : "#c99700"}
              className="pointer-events-none"
            >
              {on ? "✓" : "+"}
            </text>
            {!small && (
              <text x={x + w / 2} y={y + h / 2 + 46} textAnchor="middle" fontSize="24" fontWeight="800" fill={on ? "#111" : "#a07800"} className="pointer-events-none">
                {loc.inches.w}″ × {loc.inches.h}″
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
