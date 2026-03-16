import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://url-explainer.com",
      lastModified: new Date(),
      priority: 1,
    },
  ];
}
