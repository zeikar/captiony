import type { SubtitleItem } from "@/lib/stores/subtitle-store";

// Returns the id of the subtitle covering `currentTime`, or null if none does.
// Assumes `subtitles` is sorted by startTime for the binary search; falls back to
// a linear scan so overlapping cues are still resolved.
export const findCurrentSubtitleId = (
  subtitles: SubtitleItem[],
  currentTime: number
): string | null => {
  if (subtitles.length === 0) return null;

  // Binary search for better performance
  let left = 0;
  let right = subtitles.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const sub = subtitles[mid];

    if (currentTime >= sub.startTime && currentTime <= sub.endTime) {
      return sub.id;
    } else if (currentTime < sub.startTime) {
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }

  // Fallback to linear search if binary search fails
  const foundSub = subtitles.find(
    (sub) => currentTime >= sub.startTime && currentTime <= sub.endTime
  );
  return foundSub?.id || null;
};
