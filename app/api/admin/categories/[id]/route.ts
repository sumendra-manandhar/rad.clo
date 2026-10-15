import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server/auth";
import { slugify, store } from "@/lib/server/store";

export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/categories/[id]">) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { name?: string; description?: string; sort?: number };
  const patch: { name?: string; slug?: string; description?: string; sort?: number } = {};
  if (body.name?.trim()) {
    patch.name = body.name.trim().slice(0, 60);
    patch.slug = slugify(patch.name);
    const clash = (await store.listCategories()).find((c) => c.slug === patch.slug && c.id !== id);
    if (clash) return Response.json({ error: "A category with that name already exists." }, { status: 400 });
  }
  if (typeof body.description === "string") patch.description = body.description.trim();
  if (typeof body.sort === "number") patch.sort = body.sort;
  const category = await store.updateCategory(id, patch);
  if (!category) return Response.json({ error: "Category not found." }, { status: 404 });
  revalidatePath("/", "layout");
  return Response.json(category);
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/admin/categories/[id]">) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const category = (await store.listCategories()).find((c) => c.id === id);
  if (!category) return Response.json({ error: "Category not found." }, { status: 404 });
  const inUse = (await store.listDesigns()).filter((d) => d.category === category.slug).length;
  if (inUse > 0) {
    return Response.json(
      { error: `Move or delete the ${inUse} design(s) in "${category.name}" first.` },
      { status: 400 }
    );
  }
  await store.deleteCategory(id);
  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
