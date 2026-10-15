import { store } from "@/lib/server/store";
import OrdersManager from "@/components/admin/OrdersManager";

export default async function AdminOrders({ searchParams }: PageProps<"/admin/orders">) {
  const sp = await searchParams;
  const orders = await store.listOrders();
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  return <OrdersManager orders={orders} initialStatus={one(sp.status)} initialOpen={one(sp.open)} />;
}
