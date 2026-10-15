import "server-only";
import type { NewDesign } from "@/lib/server/store";
import { saveImageFile } from "@/lib/server/uploads";

/** Reads the admin design form (multipart) into a partial design. */
export async function parseDesignForm(form: FormData) {
  const patch: Partial<NewDesign> = {};
  const text = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" ? v.trim() : undefined;
  };
  const name = text("name");
  if (name !== undefined) patch.name = name.slice(0, 120);
  const slug = text("slug");
  if (slug) patch.slug = slug;
  const category = text("category");
  if (category !== undefined) patch.category = category;
  const description = text("description");
  if (description !== undefined) patch.description = description.slice(0, 1000);
  const price = text("price");
  if (price !== undefined) patch.price = Math.max(0, Math.round(Number(price) || 0));
  if (form.has("featured")) patch.featured = form.get("featured") === "true";
  if (form.has("active")) patch.active = form.get("active") === "true";

  const file = form.get("image");
  if (file instanceof File && file.size > 0) patch.image = await saveImageFile(file, "design");
  return patch;
}
