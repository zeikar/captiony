import type { SubtitleItem } from "@/lib/stores/subtitle-store";

// Compute time from X coordinate
export const getTimeFromX = (
  x: number,
  timelineOffset: number,
  pixelsPerSecond: number
): number => {
  return timelineOffset + x / pixelsPerSecond;
};

// Compute X coordinate from time
export const getXFromTime = (
  time: number,
  timelineOffset: number,
  pixelsPerSecond: number
): number => {
  return (time - timelineOffset) * pixelsPerSecond;
};

// Overlap detection
export const checkSubtitleOverlap = (
  subtitle1: { startTime: number; endTime: number },
  subtitle2: { startTime: number; endTime: number }
): boolean => {
  return subtitle1.startTime < subtitle2.endTime && subtitle2.startTime < subtitle1.endTime;
};

// Find all subtitles overlapping a target
export const findOverlappingSubtitles = (
  subtitles: SubtitleItem[],
  targetSubtitle: SubtitleItem
): SubtitleItem[] => {
  return subtitles.filter(
    (subtitle) =>
      subtitle.id !== targetSubtitle.id &&
      checkSubtitleOverlap(subtitle, targetSubtitle)
  );
};

// Arrange subtitles into non-overlapping layers
export const arrangeSubtitlesInLayers = (
  subtitles: SubtitleItem[]
): SubtitleItem[][] => {
  const layers: SubtitleItem[][] = [];
  const sortedSubtitles = [...subtitles].sort(
    (a, b) => a.startTime - b.startTime
  );

  sortedSubtitles.forEach((subtitle) => {
    let placed = false;

    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const lastSubtitle = layer[layer.length - 1];

      if (!lastSubtitle || lastSubtitle.endTime <= subtitle.startTime) {
        layer.push(subtitle);
        placed = true;
        break;
      }
    }

    if (!placed) {
      layers.push([subtitle]);
    }
  });

  return layers;
};
