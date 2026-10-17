import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: [string, number, MetadataRoute.Sitemap[number]["changeFrequency"]][] = [
    ["", 1, "weekly"],
    ["/customize", 0.9, "weekly"],
    ["/shop", 0.9, "daily"],
    ["/contact", 0.7, "monthly"],
    ["/size-guide", 0.5, "yearly"],
  ];
  return pages.map(([path, priority, changeFrequency]) => ({
    url: `${SITE.url}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
