import { Suspense } from "react";
import { connection } from "next/server";
import { getStorefront } from "@/lib/server/store";
import CustomizeStudio from "@/components/CustomizeStudio";

export const metadata = { title: "3D Studio — Rad.Clo" };

export default async function CustomizePage() {
  await connection(); // always show the latest designs from /admin
  const { categories, designs, pricing } = await getStorefront();
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-muted">Loading studio…</div>}>
      <CustomizeStudio categories={categories} designs={designs} pricing={pricing} />
    </Suspense>
  );
}
