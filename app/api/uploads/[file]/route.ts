import { promises as fs } from "fs";
import path from "path";
import { UPLOAD_DIR } from "@/lib/server/store";

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
};

// Serves images saved by the local store (see lib/server/store.ts).
export async function GET(_req: Request, ctx: RouteContext<"/api/uploads/[file]">) {
  const { file } = await ctx.params;
  const name = path.basename(file);
  const type = MIME[path.extname(name).toLowerCase()];
  if (!type || name !== file) return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(path.join(UPLOAD_DIR, name));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
