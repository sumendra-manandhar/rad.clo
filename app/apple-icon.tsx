import { ImageResponse } from "next/og";
import { AppMark as Mark } from "@/components/AppMark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon on iPhone */
export default function AppleIcon() {
  return new ImageResponse(<Mark px={180} />, size);
}
