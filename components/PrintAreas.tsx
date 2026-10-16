import { PRINT_LOCATIONS, areaSize, type PrintLocation } from "@/lib/print-locations";
import { formatPrice } from "@/lib/garments";

/**
 * Numbered list of print areas with their sizes and prices — the key to the
 * numbered boxes on the position guide, and a size reference for buyers.
 */
export function PrintAreasLegend({
  locations,
  prices,
  used = [],
  dark,
}: {
  locations: PrintLocation[];
  prices: Record<string, number>;
  used?: string[];
  dark?: boolean;
}) {
  return (
    <ol className="grid sm:grid-cols-2 gap-2 text-xs">
      {locations.map((l) => {
        const on = used.includes(l.id);
        return (
          <li
            key={l.id}
            className={`flex gap-2.5 rounded-xl px-3 py-2.5 ${
              on ? "bg-lime text-ink" : dark ? "bg-white/5" : "bg-paper"
            }`}
          >
            <span className="w-5 h-5 shrink-0 rounded-full bg-[#c99700] text-white text-[11px] font-black flex items-center justify-center">
              {PRINT_LOCATIONS.indexOf(l) + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex justify-between gap-2">
                <span className="font-semibold">{l.label}</span>
                <span className="opacity-70 shrink-0">+{formatPrice(prices[l.id] ?? 0)}</span>
              </span>
              <span className="block font-semibold opacity-80">{areaSize(l)}</span>
              <span className="block opacity-60 leading-snug">{l.hint}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
