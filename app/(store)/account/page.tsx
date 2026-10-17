import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ArrowUpRight, LogOut, Package } from "lucide-react";
import { store } from "@/lib/server/store";
import { currentUser } from "@/lib/server/user";
import { formatPrice } from "@/lib/garments";
import { OrderItems, OrderTimeline, orderDate } from "@/components/OrderTimeline";

export const metadata: Metadata = { title: "My orders — Rad.Clo", robots: { index: false } };

export default async function AccountPage() {
  await connection(); // always per visitor
  const user = await currentUser();
  if (!user) redirect("/login?next=/account");
  const [orders, profile] = await Promise.all([
    store.listOrdersForUser(user.id).catch(() => []),
    store.getProfile(user.id).catch(() => null),
  ]);
  const active = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      {/* Profile */}
      <div className="flex items-center gap-4">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="" className="w-14 h-14 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <span className="w-14 h-14 rounded-full bg-ink text-paper flex items-center justify-center text-xl font-bold">
            {(profile?.name || user.name)[0]?.toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl sm:text-3xl font-bold truncate">{profile?.name || user.name}</h1>
          <p className="text-sm text-muted truncate">{user.email}</p>
        </div>
        <form action="/auth/signout" method="post">
          <button className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-semibold hover:border-ink">
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Sign out</span>
          </button>
        </form>
      </div>
      {(profile?.phone || profile?.address) && (
        <p className="text-xs text-muted mt-3">
          Saved for checkout: {[profile.phone, profile.address?.split("\n")[0]].filter(Boolean).join(" · ")}
        </p>
      )}

      <div className="flex items-baseline justify-between mt-10 mb-4">
        <h2 className="font-display text-2xl font-bold">My orders</h2>
        {orders.length > 0 && (
          <p className="text-sm text-muted">
            {active.length} in progress · {orders.length} total
          </p>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line py-16 text-center">
          <Package className="w-7 h-7 mx-auto text-muted" />
          <p className="font-semibold mt-3">No orders yet</p>
          <p className="text-sm text-muted mt-1">Your orders and their printing progress will show up here.</p>
          <Link href="/customize" className="inline-block mt-5 bg-ink text-paper text-sm font-semibold px-6 py-3 rounded-full hover:bg-flame">
            Start designing
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li key={o.id} className="rounded-3xl bg-white border border-line p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xl font-bold">Order #{o.number}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {orderDate(o.createdAt)}
                    {o.trackCode && (
                      <>
                        {" "}· Tracking ID <span className="font-mono font-semibold text-ink">{o.trackCode}</span>
                      </>
                    )}
                  </p>
                </div>
                <p className="font-display text-xl font-bold">{formatPrice(o.total)}</p>
              </div>
              <OrderTimeline order={o} compact />
              <OrderItems order={o} />
              {o.trackCode && (
                <Link href={`/track/${o.trackCode}`} className="inline-flex items-center gap-1 text-sm font-semibold underline">
                  Full tracking details <ArrowUpRight className="w-4 h-4" />
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
