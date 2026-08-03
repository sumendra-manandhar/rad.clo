"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Phone, MapPin, Mail } from "lucide-react";
import {
  fetchOrderWithItems,
  updateOrderStatus,
  ORDER_STATUSES,
  type Order,
  type OrderItem,
  type OrderStatus,
} from "@/lib/orders";

const STATUS_STYLES: Record<OrderStatus, string> = {
  received: "bg-blue-100 text-blue-700",
  processing: "bg-amber-100 text-amber-700",
  printing: "bg-purple-100 text-purple-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    setLoading(true);
    const result = await fetchOrderWithItems(id);
    if (result) {
      setOrder(result.order);
      setItems(result.items);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusChange = async (status: OrderStatus) => {
    if (!order) return;
    setUpdating(true);
    const ok = await updateOrderStatus(order.id, status);
    if (ok) setOrder({ ...order, status });
    setUpdating(false);
  };

  if (loading) {
    return <div className="p-8 text-sm text-neutral-400">Loading…</div>;
  }

  if (!order) {
    return (
      <div className="p-8">
        <Link href="/admin/orders" className="text-sm text-neutral-500 hover:text-neutral-900 flex items-center gap-1.5 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to orders
        </Link>
        <p className="text-sm text-neutral-500">Order not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      <Link href="/admin/orders" className="text-sm text-neutral-500 hover:text-neutral-900 flex items-center gap-1.5 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Order {order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Placed {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
        <span
          className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[order.status]}`}
        >
          {order.status}
        </span>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        {/* Line items with design files */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">
            Items ({items.length})
          </h2>
          {items.map((item) => (
            <div key={item.id} className="border border-neutral-200 rounded-xl p-5 bg-white flex gap-5">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-neutral-900">{item.product_name}</p>
                <p className="text-sm text-neutral-500 mt-1">
                  Size {item.size} · Qty {item.qty} · ₹{item.price} each
                </p>
                {item.color_label && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <span
                      className="w-4 h-4 rounded-full border border-neutral-300"
                      style={{ backgroundColor: item.color || "#eee" }}
                    />
                    <span className="text-xs text-neutral-500">{item.color_label}</span>
                  </div>
                )}
                {item.is_custom && (
                  <div className="mt-3 pt-3 border-t border-neutral-100 space-y-1">
                    <p className="text-xs font-semibold text-neutral-700">
                      Custom design{item.design_name ? `: ${item.design_name}` : ""}
                    </p>
                    {item.design_side && (
                      <p className="text-xs text-neutral-500 capitalize">
                        Placement: {item.design_side}
                        {item.design_offset_x != null &&
                          ` · offset (${item.design_offset_x.toFixed(2)}, ${item.design_offset_y?.toFixed(2)})`}
                        {item.design_rotation != null &&
                          ` · rotation ${((item.design_rotation * 180) / Math.PI).toFixed(0)}°`}
                      </p>
                    )}
                  </div>
                )}
              </div>
              {item.design_image_url && (
                <div className="shrink-0 text-center">
                  <a
                    href={item.design_image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-28 h-28 rounded-lg border border-neutral-200 overflow-hidden bg-neutral-50"
                  >
                    <img
                      src={item.design_image_url}
                      alt="Design file"
                      className="w-full h-full object-contain"
                    />
                  </a>
                  <a
                    href={item.design_image_url}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500 hover:text-neutral-900"
                  >
                    <Download className="w-3 h-3" /> Download
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Customer + status */}
        <div className="space-y-6">
          <div className="border border-neutral-200 rounded-xl p-5 bg-white space-y-3">
            <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">
              Customer
            </h2>
            <p className="text-sm font-medium text-neutral-900">{order.customer_name}</p>
            <p className="text-sm text-neutral-600 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-neutral-400" /> {order.phone}
            </p>
            {order.email && (
              <p className="text-sm text-neutral-600 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-neutral-400" /> {order.email}
              </p>
            )}
            <p className="text-sm text-neutral-600 flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-neutral-400 mt-0.5 shrink-0" /> {order.address}
            </p>
          </div>

          <div className="border border-neutral-200 rounded-xl p-5 bg-white space-y-3">
            <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">
              Update Status
            </h2>
            <select
              value={order.status}
              disabled={updating}
              onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-900 disabled:opacity-60"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-neutral-400">
              Last updated {new Date(order.updated_at).toLocaleString()}
            </p>
          </div>

          <div className="border border-neutral-200 rounded-xl p-5 bg-white">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Order Total</span>
              <span className="font-semibold text-neutral-900">₹{order.total_price}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
