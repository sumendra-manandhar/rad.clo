import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { getStorefront } from "@/lib/server/store";
import CustomizeStudio from "@/components/CustomizeStudio";

export const metadata: Metadata = {
  title: "Design Your Own T-Shirt Online — 3D Studio",
  description:
    "Design your own custom t-shirt or hoodie online with a live 3D preview. Upload your photo or logo, add text, and we print and deliver it anywhere in Nepal.",
  alternates: { canonical: "/customize" },
};

export default async function CustomizePage() {
  await connection(); // always show the latest designs from /admin
  const { categories, designs, pricing } = await getStorefront();
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-muted">Loading studio…</div>}>
      <CustomizeStudio categories={categories} designs={designs} pricing={pricing} />
    </Suspense>
  );
}
