import type { OrderStatus } from "@/lib/types";

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">{title}</h1>
        {sub && <p className="text-sm text-muted mt-1">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-sky-100 text-sky-800",
  printing: "bg-violet-100 text-violet-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-neutral-200 text-neutral-600",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-block text-[11px] font-semibold capitalize px-2.5 py-1 rounded-full ${STATUS_STYLE[status]}`}>
      {status}
    </span>
  );
}

export const inputCls =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:border-ink";
