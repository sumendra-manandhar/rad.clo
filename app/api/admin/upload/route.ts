import { requireAdmin } from "@/lib/server/auth";
import { saveImageFile, UploadError } from "@/lib/server/uploads";

// Admin image upload (e.g. garment photos). Returns the stored image URL.
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const file = (await req.formData()).get("image");
    if (!(file instanceof File)) throw new UploadError("Please choose an image.");
    return Response.json({ url: await saveImageFile(file, "garment") });
  } catch (err) {
    if (err instanceof UploadError) return Response.json({ error: err.message }, { status: 400 });
    throw err;
  }
}
