/**
 * Calculates playback progress as a percentage.
 */
export function calculateProgress(
  currentTime: number,
  duration: number
): number {
  if (duration <= 0) return 0;
  return Math.round((currentTime / duration) * 100);
}

// Exact hostname allow-list prevents spoofed hosts like "evil.com/youtube.com/…"
// that substring checks would falsely accept.
const YOUTUBE_HOSTNAMES = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
]);

/**
 * Returns true only for real YouTube watch/shorts/youtu.be URLs.
 * Uses URL parsing + an exact hostname allow-list — never substring matching.
 */
export function isYouTubeUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  // youtu.be short links: path must be a non-empty video id
  if (parsed.hostname === "youtu.be") {
    return parsed.pathname.length > 1;
  }

  if (!YOUTUBE_HOSTNAMES.has(parsed.hostname)) {
    return false;
  }

  // /watch?v=<id>
  if (parsed.pathname === "/watch") {
    return parsed.searchParams.get("v") !== null;
  }

  // /shorts/<id>
  if (parsed.pathname.startsWith("/shorts/")) {
    return parsed.pathname.length > "/shorts/".length;
  }

  return false;
}
