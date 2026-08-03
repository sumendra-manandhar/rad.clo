"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, Package } from "lucide-react";
import {
  fetchOrders,
  fetchOrderCounts,
  ORDER_STATUSES,
  type Order,
  type OrderStatus,
} from "@/lib/orders";
import { isSupabaseConfigured } from "@/lib/supabase";

const STATUS_STYLES: Record<OrderStatus, string> = {
  received: "bg-blue-100 text-blue-700",
  processing: "bg-amber-100 text-amber-700",
  printing: "bg-purple-100 text-purple-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState<Record<OrderStatus | "all", number> | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [ordersData, countsData] = await Promise.all([
      fetchOrders(filter),
      fetchOrderCounts(),
    ]);
    setOrders(ordersData);
    setCounts(countsData);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  return (
    <div className="p-6 sm:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Orders</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {counts?.all ?? 0} total orders
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-300 rounded-full px-3 py-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {!isSupabaseConfigured && (
        <div className="mb-6 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
          Supabase isn't configured — no orders can be shown until it's
          connected. See SETUP.md.
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
            filter === "all"
              ? "bg-neutral-900 text-white"
              : "bg-white border border-neutral-300 text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          All {counts ? `(${counts.all})` : ""}
        </button>
        {ORDER_STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === s.value
                ? "bg-neutral-900 text-white"
                : "bg-white border border-neutral-300 text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {s.label} {counts ? `(${counts[s.value]})` : ""}
          </button>
        ))}
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-sm text-neutral-400">Loading…</p>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-8 h-8 mx-auto text-neutral-300 mb-2" />
            <p className="text-sm text-neutral-400">No orders yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500 uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Placed</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 cursor-pointer"
                >
                  <td className="px-0 py-0">
                    <Link href={`/admin/orders/${o.id}`} className="block px-5 py-3.5 font-medium text-neutral-900">
                      {o.customer_name}
                      <span className="block text-xs text-neutral-400 font-normal">
                        {o.id.slice(0, 8).toUpperCase()}
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-neutral-600">
                    <Link href={`/admin/orders/${o.id}`} className="block">{o.phone}</Link>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-neutral-900">
                    <Link href={`/admin/orders/${o.id}`} className="block">₹{o.total_price}</Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/orders/${o.id}`}>
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${STATUS_STYLES[o.status]}`}
                      >
                        {o.status}
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-neutral-500 text-xs">
                    <Link href={`/admin/orders/${o.id}`} className="block">
                      {new Date(o.created_at).toLocaleString()}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
