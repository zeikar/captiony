import type { MetadataRoute } from "next";

const BASE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL || "https://captiony.vercel.app"
).replace(/\/+$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
    ],
    host: BASE_URL,
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
