import { requireAdmin } from "@/lib/server/auth";
import { store } from "@/lib/server/store";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";

export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/orders/[id]">) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { status?: string; note?: string };
  const patch: { status?: OrderStatus; note?: string } = {};
  if (body.status) {
    if (!ORDER_STATUSES.includes(body.status as OrderStatus)) {
      return Response.json({ error: "Unknown status." }, { status: 400 });
    }
    patch.status = body.status as OrderStatus;
  }
  if (typeof body.note === "string") patch.note = body.note.slice(0, 1000);
  const order = await store.updateOrder(id, patch);
  if (!order) return Response.json({ error: "Order not found." }, { status: 404 });
  return Response.json(order);
}
