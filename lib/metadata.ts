import type { Metadata, Viewport } from "next";

export function getViewport(): Viewport {
  return {
    width: "device-width",
    initialScale: 1,
    themeColor: "#2EE6A8",
    colorScheme: "light dark",
  };
}

export function getMetadata(): Metadata {
  const title = "Captiony - Online Subtitle Editor";
  const description =
    "Create, edit and sync subtitles for your videos online. Free web-based subtitle editor supporting SRT and VTT formats with drag & drop functionality.";
  const siteUrl = "https://captiony.vercel.app";

  return {
    title,
    description,
    alternates: {
      canonical: siteUrl,
    },
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
      "closed captions",
      "subtitles online",
      "free subtitle editor",
      "web-based subtitle editor",
      "video accessibility",
      "subtitle synchronization",
      "subtitle timing",
      "subtitle sync",
      "youtube subtitles",
      "video transcription",
    ],
    authors: [{ name: "Captiony Team" }],
    creator: "Captiony",
    publisher: "Captiony",
    metadataBase: new URL(siteUrl),
    applicationName: "Captiony",
    category: "productivity",
    classification: "Video Editing Tool",
    openGraph: {
      type: "website",
      title,
      description,
      siteName: "Captiony",
      url: siteUrl,
      locale: "en_US",
      images: [
        {
          url: `https://dogimg.vercel.app/api/og?url=${siteUrl}/`,
          width: 1200,
          height: 630,
          alt: "Professional subtitle editing tool - Create perfect captions for your videos",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: "@captiony",
      creator: "@captiony",
      images: [
        {
          url: `https://dogimg.vercel.app/api/og?url=${siteUrl}/`,
          alt: "Professional subtitle editing tool - Create perfect captions for your videos",
        },
      ],
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
    icons: {
      icon: [
        { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: "/icons/apple-touch-icon.png",
    },
    manifest: "/icons/site.webmanifest",
    other: {
      "google-site-verification": "your-verification-code", // Replace with actual code
    },
  };
}

// JSON-LD structured data for better SEO
export function getStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Captiony",
    description:
      "Create, edit and sync subtitles for your videos online. Free web-based subtitle editor supporting SRT and VTT formats with drag & drop functionality.",
    url: "https://captiony.vercel.app",
    applicationCategory: "VideoEditingApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    creator: {
      "@type": "Organization",
      name: "Captiony Team",
    },
    featureList: [
      "Subtitle editing",
      "SRT file support",
      "VTT file support",
      "Video synchronization",
      "Export functionality",
      "Drag and drop interface",
    ],
    screenshot:
      "https://dogimg.vercel.app/api/og?url=https://captiony.vercel.app/",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
  };
}
