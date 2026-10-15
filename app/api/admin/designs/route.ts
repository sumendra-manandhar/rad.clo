import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server/auth";
import { store } from "@/lib/server/store";
import { parseDesignForm } from "@/lib/server/design-form";
import { UploadError } from "@/lib/server/uploads";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return Response.json(await store.listDesigns());
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const patch = await parseDesignForm(await req.formData());
    if (!patch.name || !patch.category || !patch.image) {
      return Response.json({ error: "Name, category and image are required." }, { status: 400 });
    }
    const design = await store.createDesign({
      name: patch.name,
      slug: patch.slug,
      category: patch.category,
      price: patch.price ?? 0,
      image: patch.image,
      description: patch.description,
      featured: patch.featured ?? false,
      active: patch.active ?? true,
    });
    revalidatePath("/", "layout");
    return Response.json(design);
  } catch (err) {
    if (err instanceof UploadError) return Response.json({ error: err.message }, { status: 400 });
    throw err;
  }
}
