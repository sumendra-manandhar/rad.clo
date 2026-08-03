import { supabase } from "@/lib/supabase";
import type { CartItem } from "@/lib/cart-context";

export type OrderStatus =
  | "received"
  | "processing"
  | "printing"
  | "shipped"
  | "delivered"
  | "cancelled";

export const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "received", label: "Order Received" },
  { value: "processing", label: "Processing" },
  { value: "printing", label: "Printing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export type Order = {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  email: string | null;
  status: OrderStatus;
  total_price: number;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_name: string;
  color: string | null;
  color_label: string | null;
  size: string | null;
  qty: number;
  price: number;
  is_custom: boolean;
  design_name: string | null;
  design_image_url: string | null;
  design_side: string | null;
  design_offset_x: number | null;
  design_offset_y: number | null;
  design_rotation: number | null;
};

export type NewOrderInput = {
  customerName: string;
  phone: string;
  address: string;
  email?: string;
  items: CartItem[];
  totalPrice: number;
};

// If the design is a data: URL (a browser-uploaded file), upload it to
// Storage so the admin panel has a real, permanent file to look at instead
// of a giant base64 string sitting in the database. Anything that's already
// a URL (a gallery print, or a Supabase-hosted design) is stored as-is.
async function ensureUploadedDesignUrl(
  src: string,
  orderIdHint: string
): Promise<string> {
  if (!src.startsWith("data:")) return src;
  if (!supabase) return src; // no backend configured — fall back to storing the raw data URL

  try {
    const res = await fetch(src);
    const blob = await res.blob();
    const ext = (blob.type.split("/")[1] || "png").replace("+xml", "");
    const path = `${orderIdHint}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage
      .from("order-designs")
      .upload(path, blob, { contentType: blob.type, upsert: true });

    if (error) {
      console.error("[orders] failed to upload design file:", error.message);
      return src;
    }

    const { data } = supabase.storage.from("order-designs").getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.error("[orders] error uploading design file:", err);
    return src;
  }
}

/**
 * Creates an order + its line items in Supabase, uploading any
 * browser-uploaded (data: URL) design files to Storage first. Returns the
 * new order's id, or null if Supabase isn't configured / the request
 * failed (the caller should still let the customer know their order was
 * "placed" either way — see app/cart/page.tsx for how that's handled).
 */
export async function createOrder(
  input: NewOrderInput
): Promise<{ id: string } | null> {
  if (!supabase) {
    console.warn(
      "[orders] Supabase not configured — order was not saved to a backend. See SETUP.md."
    );
    return null;
  }

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      customer_name: input.customerName,
      phone: input.phone,
      address: input.address,
      email: input.email || null,
      status: "received" as OrderStatus,
      total_price: input.totalPrice,
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    console.error("[orders] failed to create order:", orderErr?.message);
    return null;
  }

  const itemRows = await Promise.all(
    input.items.map(async (item) => {
      const designUrl = item.designSrc
        ? await ensureUploadedDesignUrl(item.designSrc, order.id)
        : null;
      return {
        order_id: order.id,
        product_name: item.name,
        color: item.color || null,
        color_label: item.colorLabel || null,
        size: item.size || null,
        qty: item.qty,
        price: item.price,
        is_custom: !!item.custom,
        design_name: item.designName || null,
        design_image_url: designUrl,
        design_side: item.designSide || null,
        design_offset_x: item.designOffsetX ?? null,
        design_offset_y: item.designOffsetY ?? null,
        design_rotation: item.designRotation ?? null,
      };
    })
  );

  const { error: itemsErr } = await supabase.from("order_items").insert(itemRows);
  if (itemsErr) {
    console.error("[orders] failed to save order items:", itemsErr.message);
  }

  return { id: order.id };
}

export async function fetchOrders(
  status?: OrderStatus | "all"
): Promise<Order[]> {
  if (!supabase) return [];
  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (status && status !== "all") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) {
    console.error("[orders] failed to fetch orders:", error.message);
    return [];
  }
  return (data as Order[]) || [];
}

export async function fetchOrderWithItems(
  id: string
): Promise<{ order: Order; items: OrderItem[] } | null> {
  if (!supabase) return null;

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();
  if (orderErr || !order) {
    console.error("[orders] failed to fetch order:", orderErr?.message);
    return null;
  }

  const { data: items, error: itemsErr } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", id)
    .order("created_at", { ascending: true });
  if (itemsErr) {
    console.error("[orders] failed to fetch order items:", itemsErr.message);
  }

  return { order: order as Order, items: (items as OrderItem[]) || [] };
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    console.error("[orders] failed to update order status:", error.message);
    return false;
  }
  return true;
}

export async function fetchOrderCounts(): Promise<Record<OrderStatus | "all", number>> {
  const empty: Record<OrderStatus | "all", number> = {
    all: 0,
    received: 0,
    processing: 0,
    printing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };
  if (!supabase) return empty;

  const { data, error } = await supabase.from("orders").select("status");
  if (error || !data) return empty;

  const counts = { ...empty };
  counts.all = data.length;
  for (const row of data as { status: OrderStatus }[]) {
    if (row.status in counts) counts[row.status] += 1;
  }
  return counts;
}
