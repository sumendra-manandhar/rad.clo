import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { getPricing } from "@/lib/server/store";
import { visibleGarments } from "@/lib/garments";
import { SizeChart } from "@/components/SizeChart";

export const metadata: Metadata = {
  title: "Size chart — Rad.Clo",
  description: "T-shirt, hoodie and sweatshirt measurements in cm.",
};

export default async function SizeGuidePage() {
  await connection(); // garments can be hidden from /admin
  const garments = visibleGarments(await getPricing());
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted">Size chart</p>
      <h1 className="font-display text-5xl font-bold tracking-tight mt-2">Find your fit.</h1>
      <p className="text-muted mt-4 mb-10">
        All measurements in cm. Not sure? Measure a tee you love, lay it flat, and compare. Ordering for a team?{" "}
        <Link href="/contact#quote" className="underline font-medium text-ink">
          Ask for a bulk quote
        </Link>{" "}
        and we&apos;ll help with a size split.
      </p>
      <SizeChart garments={garments} />
    </div>
  );
}
