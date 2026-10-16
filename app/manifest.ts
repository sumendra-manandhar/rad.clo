import type { MetadataRoute } from "next";

/** Lets phones "Add to Home Screen" and open Rad.Clo full-screen like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rad.Clo — Custom T-Shirts",
    short_name: "Rad.Clo",
    description: "Design custom tees with a live 3D preview. Delivered across Nepal.",
    start_url: "/",
    display: "standalone",
    background_color: "#eef2f7",
    theme_color: "#eef2f7",
    icons: [
      { src: "/app-icon/192", sizes: "192x192", type: "image/png" },
      { src: "/app-icon/512", sizes: "512x512", type: "image/png" },
      { src: "/app-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
