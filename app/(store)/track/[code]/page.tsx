import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { store } from "@/lib/server/store";
import { normaliseTrackCode } from "@/lib/track";
import { whatsappUrl } from "@/lib/contact";
import { OrderItems, OrderTimeline, orderDate } from "@/components/OrderTimeline";

export const metadata: Metadata = { title: "Order tracking — Rad.Clo", robots: { index: false } };

// Public: anyone with the tracking ID can see progress. No phone, address or
// email is shown here — only the first name.
export default async function TrackOrderPage({ params }: PageProps<"/track/[code]">) {
  const { code: raw } = await params;
  const code = normaliseTrackCode(decodeURIComponent(raw));
  if (!code) notFound();
  const order = await store.getOrderByTrackCode(code).catch(() => null);

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">We couldn&apos;t find that order</h1>
        <p className="text-muted mt-2">
          Check the tracking ID <span className="font-mono font-semibold text-ink">{code}</span> and try again.
        </p>
        <Link href="/track" className="inline-block mt-6 bg-ink text-paper font-semibold px-6 py-3 rounded-full">
          Try another ID
        </Link>
      </div>
    );
  }

  const first = order.customer.name.split(" ")[0];
  const help = whatsappUrl(`Hi Rad.Clo! A question about my order ${code}.`);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <p className="text-xs font-bold uppercase tracking-widest text-muted">Tracking ID</p>
      <h1 className="font-mono text-3xl sm:text-4xl font-bold tracking-wider mt-1">{code}</h1>
      <p className="text-muted mt-2">
        Order #{order.number}
        {first && <> for {first}</>} · placed {orderDate(order.createdAt)}
      </p>

      <div className="mt-8 rounded-3xl bg-white border border-line p-6">
        <OrderTimeline order={order} />
      </div>

      <div className="mt-4 rounded-3xl bg-white border border-line p-6">
        <h2 className="font-semibold mb-3">What&apos;s in it</h2>
        <OrderItems order={order} />
      </div>

      {help && (
        <a
          href={help}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#25D366] text-white text-sm font-semibold px-5 py-3"
        >
          <MessageCircle className="w-4 h-4" /> Ask about this order
        </a>
      )}
    </div>
  );
}
