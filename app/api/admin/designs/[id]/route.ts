import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server/auth";
import { store } from "@/lib/server/store";
import { parseDesignForm } from "@/lib/server/design-form";
import { UploadError } from "@/lib/server/uploads";

export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/designs/[id]">) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    const before = await store.getDesign(id);
    if (!before) return Response.json({ error: "Design not found." }, { status: 404 });
    const patch = await parseDesignForm(await req.formData());
    const design = await store.updateDesign(id, patch);
    if (patch.image && patch.image !== before.image) await store.deleteUpload(before.image);
    revalidatePath("/", "layout");
    return Response.json(design);
  } catch (err) {
    if (err instanceof UploadError) return Response.json({ error: err.message }, { status: 400 });
    throw err;
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/admin/designs/[id]">) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const design = await store.getDesign(id);
  if (!design) return Response.json({ error: "Design not found." }, { status: 404 });
  await store.deleteDesign(id);
  await store.deleteUpload(design.image);
  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
