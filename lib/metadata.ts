import type { Metadata } from "next";

export function getMetadata(): Metadata {
  const title = "Captiony - Web Subtitle Editor";
  const description =
    "Web-based subtitle editor - Add and edit subtitles for your videos with ease";
  const siteUrl = "https://captiony.vercel.app";

  return {
    title,
    description,
    keywords: [
      "subtitle editor",
      "video subtitles",
      "captions",
      "srt editor",
      "vtt editor",
      "video editing",
      "online subtitle editor",
      "subtitle maker",
      "video captions",
    ],
    authors: [{ name: "Captiony Team" }],
    creator: "Captiony",
    publisher: "Captiony",
    metadataBase: new URL(siteUrl),
    applicationName: "Captiony",
    category: "productivity",
    classification: "Video Editing Tool",
    themeColor: "#2EE6A8",
    colorScheme: "light dark",
    viewport: "width=device-width, initial-scale=1",
    openGraph: {
      type: "website",
      title,
      description,
      siteName: "Captiony",
      url: siteUrl,
      locale: "en_US",
      images: [`https://dogimg.vercel.app/api/og?url=${siteUrl}/`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: "@captiony",
      creator: "@captiony",
      images: [`https://dogimg.vercel.app/api/og?url=${siteUrl}/`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: "your-google-verification-code",
    },
    icons: {
      icon: [
        { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: "/icons/apple-touch-icon.png",
    },
    manifest: "/icons/site.webmanifest",
  };
}
