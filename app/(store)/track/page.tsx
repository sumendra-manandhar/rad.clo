import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { normaliseTrackCode } from "@/lib/track";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Track your Rad.Clo custom t-shirt order with your tracking code.",
  alternates: { canonical: "/track" },
};

export default async function TrackPage({ searchParams }: PageProps<"/track">) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.code) ? sp.code[0] : sp.code;
  const code = raw ? normaliseTrackCode(raw) : null;
  if (code) redirect(`/track/${code}`);

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <span className="w-14 h-14 mx-auto rounded-full bg-lime flex items-center justify-center">
        <Package className="w-6 h-6" />
      </span>
      <h1 className="font-display text-4xl font-bold tracking-tight mt-5">Track your order</h1>
      <p className="text-muted mt-2">Enter the tracking ID from your order confirmation.</p>
      <form action="/track" className="mt-8 flex gap-2">
        <input
          name="code"
          required
          defaultValue={raw ?? ""}
          placeholder="RC-XXXX-XXXX"
          autoCapitalize="characters"
          className="flex-1 min-w-0 rounded-full border border-line bg-white px-5 py-3.5 font-mono uppercase tracking-wider focus:outline-none focus:border-ink"
        />
        <button className="shrink-0 rounded-full bg-ink text-paper font-semibold px-6 hover:bg-flame">Track</button>
      </form>
      {raw && !code && <p className="text-sm text-red-600 mt-3">That doesn&apos;t look like a tracking ID — it&apos;s 8 letters and numbers after RC-.</p>}
    </div>
  );
}
