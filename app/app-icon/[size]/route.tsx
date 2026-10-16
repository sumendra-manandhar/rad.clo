import { ImageResponse } from "next/og";
import { AppMark as Mark } from "@/components/AppMark";

const SIZES = [192, 512];

/** App icons for the web manifest (/app-icon/192, /app-icon/512). */
export async function GET(_req: Request, ctx: RouteContext<"/app-icon/[size]">) {
  const { size } = await ctx.params;
  const px = SIZES.includes(Number(size)) ? Number(size) : 192;
  return new ImageResponse(<Mark px={px} />, { width: px, height: px });
}
