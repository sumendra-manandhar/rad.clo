import Link from "next/link";
import { ArrowUpRight, Database, Info } from "lucide-react";
import { store, storeDriver } from "@/lib/server/store";
import { adminPassword } from "@/lib/server/auth";
import { formatPrice } from "@/lib/garments";
import { getLocation } from "@/lib/print-locations";
import { PageHeader, StatusBadge } from "@/components/admin/ui";

export default async function AdminOverview() {
  const [orders, designs, categories] = await Promise.all([store.listOrders(), store.listDesigns(), store.listCategories()]);
  const live = orders.filter((o) => o.status !== "cancelled");
  const revenue = live.reduce((s, o) => s + o.total, 0);
  const pending = orders.filter((o) => o.status === "pending").length;
  const inProduction = orders.filter((o) => o.status === "confirmed" || o.status === "printing").length;

  // Units sold per store design
  const units = new Map<string, number>();
  for (const o of live)
    for (const i of o.items)
      for (const p of i.prints) if (p.designId) units.set(p.designId, (units.get(p.designId) ?? 0) + i.qty);
  const top = designs
    .map((d) => ({ d, n: units.get(d.id) ?? 0 }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 5);
  const allPrints = live.flatMap((o) => o.items.flatMap((i) => i.prints.map((p) => ({ ...p, qty: i.qty }))));
  const customCount = allPrints.filter((p) => p.designType === "upload" || p.designType === "text").length;
  const locationCounts = new Map<string, number>();
  for (const p of allPrints) locationCounts.set(p.location, (locationCounts.get(p.location) ?? 0) + p.qty);
  const topLocations = [...locationCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

  const usingDevPassword = !process.env.ADMIN_PASSWORD && adminPassword();

  return (
    <>
      <PageHeader title="Overview" sub="Your store at a glance." />

      {usingDevPassword && (
        <div className="mb-6 flex gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            You&apos;re using the development password <code className="font-mono">admin123</code>. Set{" "}
            <code className="font-mono">ADMIN_PASSWORD</code> and <code className="font-mono">SESSION_SECRET</code> in{" "}
            <code className="font-mono">.env.local</code> before going live.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Revenue" value={formatPrice(revenue)} hint={`${live.length} orders`} />
        <Stat label="New orders" value={String(pending)} hint="awaiting confirmation" accent={pending > 0} href="/admin/orders?status=pending" />
        <Stat label="In production" value={String(inProduction)} hint="confirmed + printing" href="/admin/orders" />
        <Stat
          label="Live designs"
          value={`${designs.filter((d) => d.active).length}/${designs.length}`}
          hint={`${categories.length} categories`}
          href="/admin/designs"
        />
      </div>

      <div className="grid xl:grid-cols-[1.4fr_1fr] gap-6 mt-8">
        <section className="rounded-3xl bg-white border border-line p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm font-medium inline-flex items-center gap-1 hover:text-flame">
              All orders <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-muted py-8 text-center">No orders yet. They&apos;ll appear here as soon as a customer checks out.</p>
          ) : (
            <ul className="divide-y divide-line">
              {orders.slice(0, 6).map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders?open=${o.id}`} className="flex items-center gap-4 py-3 hover:bg-paper -mx-2 px-2 rounded-xl">
                    <span className="font-mono text-sm font-semibold">#{o.number}</span>
                    <span className="flex-1 min-w-0 truncate text-sm">
                      {o.customer.name} · {o.items.reduce((s, i) => s + i.qty, 0)} item(s)
                    </span>
                    <StatusBadge status={o.status} />
                    <span className="text-sm font-semibold w-20 text-right">{formatPrice(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-3xl bg-white border border-line p-6">
          <h2 className="font-semibold mb-4">Best-selling designs</h2>
          {top.length === 0 ? (
            <p className="text-sm text-muted py-8 text-center">Sales data will show up after your first orders.</p>
          ) : (
            <ul className="space-y-3">
              {top.map(({ d, n }) => (
                <li key={d.id} className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.image} alt="" className="w-11 h-11 rounded-lg object-contain bg-paper p-1" />
                  <span className="flex-1 min-w-0 truncate text-sm font-medium">{d.name}</span>
                  <span className="text-sm text-muted">{n} sold</span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted mt-6 pt-4 border-t border-line">
            {customCount} print(s) with customer-uploaded art or text.
            {topLocations.length > 0 && (
              <>
                {" "}Most popular spots:{" "}
                {topLocations.map(([id, n]) => `${getLocation(id)?.label ?? id} (${n})`).join(", ")}.
              </>
            )}
          </p>
        </section>
      </div>

      <p className="mt-8 text-xs text-muted flex items-center gap-1.5">
        <Database className="w-3.5 h-3.5" />
        Storage: {storeDriver === "supabase" ? "Supabase" : "local files (data/db.json)"}
      </p>
    </>
  );
}

function Stat({ label, value, hint, accent, href }: { label: string; value: string; hint: string; accent?: boolean; href?: string }) {
  const body = (
    <div className={`rounded-3xl p-5 h-full border ${accent ? "bg-lime border-lime" : "bg-white border-line"}`}>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="font-display text-3xl font-bold mt-2">{value}</p>
      <p className="text-xs text-muted mt-1">{hint}</p>
    </div>
  );
  return href ? <Link href={href} className="block hover:-translate-y-0.5 transition-transform">{body}</Link> : body;
}
