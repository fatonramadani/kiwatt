import type { MetadataRoute } from "next";

const locales = ["fr", "en", "de", "it"];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://kiwatt.ch";

  const staticPages = ["", "/legal", "/privacy", "/terms"];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const page of staticPages) {
      entries.push({
        url: `${baseUrl}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === "" ? "weekly" : "monthly",
        priority: page === "" ? 1 : 0.5,
      });
    }
  }

  return entries;
}
