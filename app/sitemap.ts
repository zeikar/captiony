import type { MetadataRoute } from "next";

const BASE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL || "https://captiony.vercel.app"
).replace(/\/+$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date();

  const routes: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"];
    priority: number;
  }> = [{ path: "/", changeFrequency: "daily", priority: 1.0 }];

  return routes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: currentDate,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
