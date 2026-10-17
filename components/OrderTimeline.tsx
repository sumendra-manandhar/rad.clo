import { Check, XCircle } from "lucide-react";
import { TRACK_STEPS, stepIndex } from "@/lib/track";
import { formatPrice } from "@/lib/garments";
import { getLocation } from "@/lib/print-locations";
import type { Order } from "@/lib/types";

/** Progress from "Order received" to "Delivered". */
export function OrderTimeline({ order, compact }: { order: Order; compact?: boolean }) {
  if (order.status === "cancelled") {
    return (
      <p className="flex items-center gap-2 rounded-2xl bg-neutral-100 px-4 py-3 text-sm text-neutral-600">
        <XCircle className="w-4 h-4" /> This order was cancelled. Questions? Contact us with your tracking ID.
      </p>
    );
  }
  const at = stepIndex(order.status);

  if (compact) {
    return (
      <div>
        <div className="flex gap-1" aria-hidden>
          {TRACK_STEPS.map((s, i) => (
            <span key={s.status} className={`h-1.5 flex-1 rounded-full ${i <= at ? "bg-ink" : "bg-line"}`} />
          ))}
        </div>
        <p className="text-sm mt-2">
          <span className="font-semibold">{TRACK_STEPS[at]?.label}</span>
          <span className="text-muted"> · step {at + 1} of {TRACK_STEPS.length}</span>
        </p>
      </div>
    );
  }

  return (
    <ol className="relative">
      {TRACK_STEPS.map((s, i) => {
        const done = i < at;
        const now = i === at;
        return (
          <li key={s.status} className="flex gap-4 pb-6 last:pb-0 relative">
            {i < TRACK_STEPS.length - 1 && (
              <span className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${i < at ? "bg-ink" : "bg-line"}`} aria-hidden />
            )}
            <span
              className={`relative z-10 w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                done ? "bg-ink text-lime" : now ? "bg-lime text-ink ring-4 ring-lime/30" : "bg-white border-2 border-line text-muted"
              }`}
            >
              {done ? <Check className="w-4 h-4" strokeWidth={3} /> : i + 1}
            </span>
            <span className="pt-1">
              <span className={`block font-semibold ${i > at ? "text-muted" : ""}`}>{s.label}</span>
              {now && <span className="block text-sm text-muted mt-0.5">{s.hint}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** One line per shirt: garment, colour, size, quantity and where it's printed. */
export function OrderItems({ order }: { order: Order }) {
  return (
    <ul className="space-y-2">
      {order.items.map((it, i) => (
        <li key={it.id || i} className="flex gap-3 text-sm">
          <span className="w-4 h-4 mt-0.5 rounded-full border border-black/15 shrink-0" style={{ backgroundColor: it.color }} />
          <span className="min-w-0 flex-1">
            <span className="block font-medium">
              {it.qty} × {it.garmentLabel} · {it.colorLabel} · {it.size}
            </span>
            <span className="block text-xs text-muted">
              {it.prints.length
                ? it.prints.map((p) => `${getLocation(p.location)?.label ?? p.location}: ${p.designName}`).join(" · ")
                : "Plain"}
            </span>
          </span>
          <span className="shrink-0 text-muted">{formatPrice(it.unitPrice * it.qty)}</span>
        </li>
      ))}
    </ul>
  );
}

export const orderDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
