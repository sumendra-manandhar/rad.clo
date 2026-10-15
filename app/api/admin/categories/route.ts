import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server/auth";
import { slugify, store } from "@/lib/server/store";

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = (await req.json().catch(() => ({}))) as { name?: string; description?: string };
  const name = body.name?.trim().slice(0, 60);
  if (!name) return Response.json({ error: "Name is required." }, { status: 400 });
  const existing = await store.listCategories();
  const slug = slugify(name);
  if (existing.some((c) => c.slug === slug)) {
    return Response.json({ error: "A category with that name already exists." }, { status: 400 });
  }
  const sort = Math.max(0, ...existing.map((c) => c.sort)) + 1;
  const category = await store.createCategory({ name, slug, description: body.description?.trim(), sort });
  revalidatePath("/", "layout");
  return Response.json(category);
}
