import { store } from "@/lib/server/store";
import { formatPrice } from "@/lib/garments";
import { PageHeader } from "@/components/admin/ui";

export default async function AdminCustomers() {
  const result = await Promise.all([store.listProfiles(), store.listOrders()]).then(
    ([profiles, orders]) => ({ profiles, orders, error: null }),
    (err: Error) => ({ profiles: null, orders: null, error: err.message })
  );
  if (!result.profiles) {
    return (
      <>
        <PageHeader title="Customers" sub="Customers who signed in with Google." />
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 text-sm text-amber-900">
          <p className="font-semibold">Customers can&apos;t be loaded yet.</p>
          <p className="mt-1">
            Run <code className="font-mono">supabase/accounts.sql</code> in the Supabase SQL editor, then reload this page.
          </p>
          <p className="mt-2 text-xs opacity-70">{result.error}</p>
        </div>
      </>
    );
  }

  const { profiles, orders } = result;
  const stats = new Map<string, { count: number; spent: number; last?: string }>();
  for (const o of orders!) {
    if (!o.userId) continue;
    const s = stats.get(o.userId) ?? { count: 0, spent: 0 };
    s.count++;
    if (o.status !== "cancelled") s.spent += o.total;
    if (!s.last || o.createdAt > s.last) s.last = o.createdAt;
    stats.set(o.userId, s);
  }
  const date = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");

  return (
    <>
      <PageHeader title="Customers" sub={`${profiles.length} signed-in customer${profiles.length === 1 ? "" : "s"}`} />
      {profiles.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line py-20 text-center text-sm text-muted">
          Customers appear here after they sign in with Google and place an order.
        </div>
      ) : (
        <div className="rounded-3xl bg-white border border-line overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-paper text-xs uppercase tracking-wider text-muted text-left">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4 text-right">Orders</th>
                <th className="py-3 px-4 text-right">Spent</th>
                <th className="py-3 px-4">Last order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {profiles.map((p) => {
                const s = stats.get(p.id);
                return (
                  <tr key={p.id} className="align-top">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {p.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.avatarUrl} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="w-8 h-8 rounded-full bg-ink text-paper flex items-center justify-center text-xs font-bold">
                            {p.name[0]?.toUpperCase()}
                          </span>
                        )}
                        <span>
                          <span className="block font-semibold">{p.name}</span>
                          <a href={`mailto:${p.email}`} className="block text-xs text-muted hover:underline">
                            {p.email}
                          </a>
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{p.phone || "—"}</td>
                    <td className="py-3 px-4 max-w-56 text-xs text-muted whitespace-pre-line">{p.address || "—"}</td>
                    <td className="py-3 px-4 text-right">
                      {s?.count ? (
                        <a href={`/admin/orders?q=${encodeURIComponent(p.phone || p.name)}`} className="font-semibold underline">
                          {s.count}
                        </a>
                      ) : (
                        0
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">{formatPrice(s?.spent ?? 0)}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-muted">{date(s?.last)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
