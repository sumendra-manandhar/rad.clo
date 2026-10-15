import "server-only";
import { store } from "@/lib/server/store";

const TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export class UploadError extends Error {}

/** Validates an uploaded image File and stores it, returning its public URL. */
export async function saveImageFile(file: File, folder: string) {
  const ext = TYPES[file.type];
  if (!ext) throw new UploadError("Please upload a PNG, JPG or WEBP image.");
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("Image must be 10 MB or smaller.");
  return store.saveUpload(Buffer.from(await file.arrayBuffer()), ext, folder);
}

/** Same as saveImageFile, for a base64 data URL (e.g. a canvas snapshot). */
export async function saveDataUrl(dataUrl: string, folder: string) {
  const m = /^data:(image\/[a-z]+);base64,(.+)$/.exec(dataUrl);
  const ext = m && TYPES[m[1]];
  if (!m || !ext) throw new UploadError("Invalid image data.");
  const buf = Buffer.from(m[2], "base64");
  if (buf.length > MAX_UPLOAD_BYTES) throw new UploadError("Image must be 10 MB or smaller.");
  return store.saveUpload(buf, ext, folder);
}
