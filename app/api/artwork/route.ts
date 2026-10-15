import { saveDataUrl, UploadError } from "@/lib/server/uploads";

// Customer artwork / text designs / 3D preview snapshots, uploaded when an
// item is added to the cart so the print file travels with the order.
export async function POST(req: Request) {
  try {
    const { dataUrl, kind } = (await req.json()) as { dataUrl?: string; kind?: string };
    if (typeof dataUrl !== "string") throw new UploadError("Missing image.");
    const folder = kind === "preview" ? "preview" : "artwork";
    return Response.json({ url: await saveDataUrl(dataUrl, folder) });
  } catch (err) {
    const message = err instanceof UploadError ? err.message : "Upload failed.";
    if (!(err instanceof UploadError)) console.error("[artwork]", err);
    return Response.json({ error: message }, { status: 400 });
  }
}
